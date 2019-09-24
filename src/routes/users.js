const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const userRepo = require("../services/user-repo");
const orgRepo = require("../services/org-repo");
const { authenticate, authorize } = require("../services/auth");
const { UnauthorizedApiError, InvalidArgumentApiError, ErrorCode, ValidationCode, ApiError, ApiErrorField, handleApiError } = require("../services/errors");
const { Role, AccessRight } = require("../services/auth-roles");
const { ModelSchema } = require("../services/validation");
const { toObjectIdArray } = require("../utils/helpers");
const passport = require('passport');

const validateOrgReferences = async (user) => {
  // Make sure the organization references are valid.
  // For now we just count the orgs with IDs specified and check that they match the length of the org list.
  let orgIds = toObjectIdArray(user.orgs);
  let orgCount = await orgRepo.countAllInIdArray(orgIds);
  if (orgIds.length !== orgCount) {
    return new ApiError(
      ErrorCode.VALIDATION,
      "Invalid Organization.",
      [new ApiErrorField("orgs", "Organization not found.", ValidationCode.RESOURCE_NOT_FOUND)]);
  }
  return null;
};

const validateUserWriteAuthorization = (req, user) => {
  // Make sure the authenticated user is authorized to create or edit another user.
  let authUser = req.user;
  // Super users can do everything, so we only need to check if the authenticated user is not a super user.
  if (!(authUser.role === Role.SUPER && authUser.accessRight === AccessRight.WRITE)) {
    // Only super users can create or edit another super user.
    if (user.role === Role.SUPER) {
      return new UnauthorizedApiError("Only superusers with write access can create or update another superuser.");
    }
    // Authenticated user needs write access to be able to create or edit anything
    if (authUser.accessRight !== AccessRight.WRITE) {
      return new UnauthorizedApiError();
    }
    for (let orgId of user.orgs) {
      // Authenticated user needs access to all orgs that the new user is assigned to.
      if (!authUser.orgs.includes(orgId)) {
        return new UnauthorizedApiError(`You are not authorized for organization ID ${orgId}.`);
      }
    }
  }
  return null;
};

router.post("/login", passport.authenticate('json'), async (req, res, next) => {
  try {
    let user = req.user;
    if (user) {
      const {hash, ...userWithoutHash} = user;
      return res.json(userWithoutHash);
    } else {
      return handleApiError(res, new ApiError(ErrorCode.AUTHENTICATION_FAILED, "Username or password is incorrect."));
    }
  } catch (err) {
    next(err);
  }
});

router.post("/:userId/changepassword", authorize(), async (req, res, next) => {
  try {
    if (req.user.sub !== req.params.userId) {
      return handleApiError(res, new UnauthorizedApiError());
    }
    let user = await userRepo.getById(req.params.userId);
    if (!user) {
      return handleApiError(res, new ApiError(ErrorCode.RESOURCE_NOT_FOUND, "User not found."));
    }
    let validationErrors = [];
    if (!bcrypt.compareSync(req.body.currentPassword, user.hash)) {
      validationErrors.push(new ApiErrorField("currentPassword", "Invalid current password.", ValidationCode.INVALID_PASSWORD));
    }
    if (req.body.newPassword !== req.body.confirmPassword) {
      validationErrors.push(new ApiErrorField("confirmPassword", "Confirm password does not match new password.", ValidationCode.COMPARE));
    }
    if (validationErrors.length > 0) {
      return handleApiError(res, new ApiError(ErrorCode.VALIDATION, "Validation Error.", validationErrors));
    }

    let hash = await bcrypt.hash(req.body.newPassword, 10);
    await userRepo.setPasswordHash(user._id, hash);
    return res.json({ message: "Password changed successfully." });
  } catch (err) {
    next(err);
  }
});

router.post("/", authorize(), async (req, res, next) => {
  try {
    let user = req.body;
    let userSchema = userRepo.UserSchema.getUserWithPasswordSchema();

    let validation = ModelSchema.validate(user, userSchema);
    if (validation.errors !== null) {
      return handleApiError(res, new ApiError(ErrorCode.VALIDATION, "Validation Error.", validation.errors));
    }

    // Force email to lowercase
    user.email = user.email.toLowerCase();

    let orgReferenceError = await validateOrgReferences(user);
    if (orgReferenceError) {
      return handleApiError(res, orgReferenceError);
    }

    let authError = validateUserWriteAuthorization(req, user);
    if (authError) {
      return handleApiError(res, authError);
    }

    let emailExist = await userRepo.getByEmail(user.email);
    if (emailExist !== null) {
      return handleApiError(res,
        new ApiError(
          ErrorCode.ALREADY_EXISTS,
          "Email address already registered.",
          [new ApiErrorField("email", "Email address already registered.", ValidationCode.UNIQUE)]));
    }

    let { password, confirmPassword, ...dbUser } = user;
    dbUser.hash = await bcrypt.hash(user.password, 10);
    // If the new user is a superuser then clear the orgs array for the user,
    // else convert org string array to ObjectId array
    if (dbUser.role === Role.SUPER) {
      dbUser.orgs = [];
    } else {
      dbUser.orgs = toObjectIdArray(user.orgs);
    }
    await userRepo.add(dbUser);
    let { hash, ...userWithoutHash } = dbUser;

    return res.json({
      message: "User added successfully.",
      data: userWithoutHash
    });

  } catch (err) {
    next(err);
  }
});

router.put("/:userId", authorize(), async (req, res, next) => {
  try {
    let user = req.body;
    let userSchema = user.password && user.password.length > 0 ? userRepo.UserSchema.getUserWithPasswordSchema() : userRepo.UserSchema.getUserSchema();

    let validation = ModelSchema.validate(user, userSchema);
    if (validation.errors !== null) {
      return handleApiError(res, new ApiError(ErrorCode.VALIDATION, "Validation Error.", validation.errors));
    }

    // Force email to lowercase
    user.email = user.email.toLowerCase();

    let orgReferenceError = await validateOrgReferences(user);
    if (orgReferenceError) {
      return handleApiError(res, orgReferenceError);
    }

    let authError = validateUserWriteAuthorization(req, user);
    if (authError) {
      return handleApiError(res, authError);
    }

    let existingUser = await userRepo.getById(req.params.userId);
    if (!existingUser) {
      return handleApiError(res, new ApiError(ErrorCode.RESOURCE_NOT_FOUND, "User not found."));
    }
    if (user.email !== existingUser.email) {
      let emailExist = await userRepo.getByEmail(user.email);
      if (emailExist !== null) {
        return handleApiError(res,
          new ApiError(
            ErrorCode.ALREADY_EXISTS,
            "Email address already registered.",
            [new ApiErrorField("email", "Email address already registered.", ValidationCode.UNIQUE)]));
      }
    }

    // If the user is a superuser then clear the orgs array for the user,
    // else convert org string array to ObjectId array
    if (user.role === Role.SUPER) {
      user.orgs = [];
    } else {
      user.orgs = toObjectIdArray(user.orgs);
    }

    await userRepo.updateById(req.params.userId, user);
    // Update password if one has been supplied
    if (user.password && user.password.length > 0) {
      let hash = await bcrypt.hash(user.password, 10);
      await userRepo.setPasswordHash(req.params.userId, hash);
    }

    return res.json({ message: "User updated successfully." });

  } catch (err) {
    next(err);
  }
});

router.delete("/:userId", authorize(), async (req, res, next) => {
  try {
    let user = await userRepo.getById(req.params.userId);
    if (!user) {
      return handleApiError(res, new ApiError(ErrorCode.RESOURCE_NOT_FOUND, "User not found."));
    }
    let authError = validateUserWriteAuthorization(req, user);
    if (authError) {
      return handleApiError(res, authError);
    }
    await userRepo.removeById(req.params.userId);
    return res.json({ message: "User deleted." });
  } catch (err) {
    next(err);
  }
});

router.get("/", authorize(), async (req, res, next) => {
  try {
    let result;
    if (req.user.role === Role.SUPER) {
      result = await userRepo.getAll();
    } else {
      result = await userRepo.getAllInOrgIdArray(toObjectIdArray(req.user.orgs));
    }
    return res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post("/:userId/settings", async (req, res, next) => {
  const validKeys = ['theme'];
  const { userId } = req.params;
  let settings = req.body;
  let userSchema = userRepo.UserSchema.getUserSchema();

  // only authenticated user can update settings
  if (req.user.sub !== userId)
    return handleApiError(res, new UnauthorizedApiError());

  if (typeof settings !== 'object')
    return handleApiError(res, new InvalidArgumentApiError());

  // accepts only allowed keys
  settings = (({ theme }) => ({ theme }))(settings);

  try {
    let result;
    let user = await userRepo.getById(userId);

    (user.settings && typeof(user.settings) === 'object') || (user.settings = {});
    user.settings = {...user.settings, ...settings};

    let validation = ModelSchema.validate(user, userSchema);
    if (validation.errors !== null) {
      return handleApiError(res, new ApiError(ErrorCode.VALIDATION, "Validation Error.", validation.errors));
    }

    await userRepo.updateUserSettings(userId, settings);
    return res.json(user.settings);
  } catch (err) {
    next(err);
  }
});

module.exports = router;