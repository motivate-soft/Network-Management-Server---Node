const express = require("express");
const router = express.Router();
const orgRepo = require("../services/org-repo");
const userRepo = require("../services/user-repo");
const fileRepo = require("../services/file-repo");
const { toObjectIdArray } = require("../utils/helpers");
const { Role, AccessRight } = require("../services/auth-roles");
const { authorize } = require("../services/auth");
const { ModelSchema } = require("../services/validation");
const { UnauthorizedApiError, ErrorCode, ApiError, handleApiError } = require("../services/errors");

// Setup authorization middleware
router.use(authorize());

router.post("/", async (req, res, next) => {
  try {
    let org = req.body;
    let orgSchema = orgRepo.OrgSchema.getOrgSchema();

    let validation = ModelSchema.validate(org, orgSchema);
    if (validation.errors !== null) {
      return handleApiError(res, new ApiError(ErrorCode.VALIDATION, "Validation Error.", validation.errors));
    }

    // Force email to lowercase
    org.contact.email = org.contact.email.toLowerCase();

    // Only superusers with write access can create new orgs.
    let authUser = req.user;
    if (!(authUser.role === Role.SUPER && authUser.accessRight === AccessRight.WRITE)) {
      return handleApiError(res, new UnauthorizedApiError("You are not authorized to create a new organization."));
    }

    await orgRepo.add(org);
    return res.json({
      message: "Organization added successfully.",
      data: org
    });

  } catch (err) {
    next(err);
  }
});

router.get("/:orgId/backups", async (req, res, next) => {
  try {
    let result = await fileRepo.getAllOrgBackupFiles(req.params.orgId);
    return res.json(result);
  } catch (err) {
    next(err);
  }
});

router.delete("/:orgId/backups", async (req, res, next) => {
  try {
    let backupIds = req.body;
    await fileRepo.deleteDeviceBackupFilesInArray(toObjectIdArray(backupIds));
    return res.json([]);
  } catch (err) {
    next(err);
  }
});

router.get("/:orgId/backupsettings", async (req, res, next) => {
  try {
    let result = await orgRepo.getBackupSettings(req.params.orgId);
    return res.json(result.backupSettings);
  } catch (err) {
    next(err);
  }
});

router.put("/:orgId/backupsettings", async (req, res, next) => {
  try {
    let backupSettings = req.body;
    let backupSettingsSchema = orgRepo.OrgSchema.getOrgBackupSettingsSchema();

    if (backupSettings.count === undefined || backupSettings.count === null) {
      backupSettings.count = 1;
    }
    if (backupSettings.time === undefined || backupSettings.time === null) {
      backupSettings.time = 0;
    }
    let validation = ModelSchema.validate(backupSettings, backupSettingsSchema);
    if (validation.errors !== null) {
      return handleApiError(res, new ApiError(ErrorCode.VALIDATION, "Validation Error.", validation.errors));
    }

    // Authorization - Only superusers with write access and org users with write access to this org is authorized to update the org.
    let authUser = req.user;
    if (authUser.accessRight === AccessRight.READ || (authUser.role === Role.ORG && !authUser.orgs.includes(req.params.orgId))) {
      return handleApiError(res, new UnauthorizedApiError("You are not authorized to update this organization."));
    }

    let existingOrg = await orgRepo.getById(req.params.orgId);
    if (!existingOrg) {
      return handleApiError(res, new ApiError(ErrorCode.RESOURCE_NOT_FOUND, "Organization not found."));
    }

    await orgRepo.updateBackupSettings(req.params.orgId, backupSettings);
    return res.json({ message: "Backup settings updated successfully." });
  } catch (err) {
    next(err);
  }
});

router.put("/:orgId", async (req, res, next) => {
  try {
    let org = req.body;
    let orgSchema = orgRepo.OrgSchema.getOrgSchema();

    let validation = ModelSchema.validate(org, orgSchema);
    if (validation.errors !== null) {
      return handleApiError(res, new ApiError(ErrorCode.VALIDATION, "Validation Error.", validation.errors));
    }

    // Force email to lowercase
    org.contact.email = org.contact.email.toLowerCase();

    // Authorization - Only superusers with write access and org users with write access to this org is authorized to update the org.
    let authUser = req.user;
    if (authUser.accessRight === AccessRight.READ || (authUser.role === Role.ORG && !authUser.orgs.includes(req.params.orgId))) {
      return handleApiError(res, new UnauthorizedApiError("You are not authorized to update this organization."));
    }

    let existingOrg = await orgRepo.getById(req.params.orgId);
    if (!existingOrg) {
      return handleApiError(res, new ApiError(ErrorCode.RESOURCE_NOT_FOUND, "Organization not found."));
    }

    await orgRepo.updateById(req.params.orgId, org);
    return res.json({ message: "Organization updated successfully." });

  } catch (err) {
    next(err);
  }
});

router.delete("/:orgId", async (req, res, next) => {
  try {
    let org = await orgRepo.getById(req.params.orgId);
    if (!org) {
      return handleApiError(res, new ApiError(ErrorCode.RESOURCE_NOT_FOUND, "Organization not found."));
    }

    // Authorization - Only superusers with write access and org users with write access to this org is authorized to delete the org.
    let authUser = req.user;
    if (authUser.accessRight === AccessRight.READ || (authUser.role === Role.ORG && !authUser.orgs.includes(req.params.orgId))) {
      return handleApiError(res, new UnauthorizedApiError("You are not authorized to delete this organization."));
    }

    // Remove org from users
    await userRepo.removeOrgIdFromAll(req.params.orgId);
    // Delete org
    await orgRepo.removeById(req.params.orgId);
    return res.json({ message: "Organization deleted." });

  } catch (err) {
    next(err);
  }
});

router.get("/", async (req, res, next) => {
  try {
    let result;
    if (req.user.role === Role.SUPER) {
      result = await orgRepo.getAll();
    } else {
      result = await orgRepo.getAllInIdArray(toObjectIdArray(req.user.orgs));
    }
    result.map(x => {
      x.userCount = x.users.length;
      x.deviceCount = x.devices.length;
      return x;
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;