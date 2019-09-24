const expressJwt = require("express-jwt");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { Role, AccessRight } = require("./auth-roles");
const { UnauthorizedApiError, InvalidArgumentApiError, UnauthenticatedApiError, handleApiError } = require("./errors");
const userRepo = require("./user-repo");
const deviceRepo = require("./device-repo");



async function authenticate({ email, password }) {
  const user = await userRepo.getByEmail(email.toLowerCase());
  if (user && bcrypt.compareSync(password, user.hash)) {
    const { hash, ...userWithoutHash } = user;
    /*const token = jwt.sign({
      sub: user._id,
      role: user.role,
      accessRight: user.accessRight,
      orgs: user.orgs
    }, secret);*/
    //req.session.sub = user._id;
    //req.session.role = user.role;
    //req.session.accessRight = user.accessRight;
    //req.session.orgs = user.orgs;

    return {
      ...userWithoutHash
    };
  }
}

function authorize() {
  return [
    // authenticate JWT token and attach user to request object (req.user)
    // expressJwt({ secret }),

    // authorize based on user role and orgs
    async (req, res, next) => {
      if (!req.user) {
        return handleApiError(res, new UnauthenticatedApiError());
      }

      // Super user with write access has access to everything
      if (req.user.role === Role.SUPER && req.user.accessRight === AccessRight.WRITE) {
        return next();
      }

      // Org user only has access to specifically assigned orgs
      if (req.params.orgId && req.user.role === Role.ORG && !req.user.orgs.includes(req.params.orgId)) {
        return handleApiError(res, new UnauthorizedApiError());
      }

      // We now know the user has access to the org, but check that the device actually belongs to this org
      if (req.params.orgId && req.params.deviceId) {
        try {
          let device = await deviceRepo.getDeviceOrgId(req.params.deviceId);
          if (device.orgId.toHexString() !== req.params.orgId) {
            return handleApiError(res, new InvalidArgumentApiError("deviceId", `Device ${req.params.deviceId} is not associated with organization ${req.params.orgId}.`));
          }
        } catch (err) {
          next(err);
        }
      }

      // For anything other than GET you need Write access, except for /api/users where
      // we apply custom authorization logic inside the controller.
      if (!req.baseUrl.startsWith("/api/users") && req.method !== "GET" && req.user.accessRight !== AccessRight.WRITE) {
        return handleApiError(res, new UnauthorizedApiError());
      }

      // authentication and authorization successful
      next();
    }
  ];
}

module.exports = {
  authenticate,
  authorize
};