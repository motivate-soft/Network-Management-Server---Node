const express = require("express");
const router = express.Router();
const orgRepo = require("../services/org-repo");
const deviceRepo = require("../services/device-repo");
const { toObjectIdArray } = require("../utils/helpers");
const { Role, AccessRight } = require("../services/auth-roles");
const { authorize } = require("../services/auth");
const { ModelSchema } = require("../services/validation");
const { ErrorCode, ValidationCode, UnauthorizedApiError, ApiError, ApiErrorField, handleApiError } = require("../services/errors");

// Setup authorization middleware
router.use(authorize());

router.put("/:deviceId", async (req, res, next) => {
  try {
    let device = req.body;
    
    let deviceUpdateSchema = deviceRepo.DeviceSchema.getDeviceUpdateSchema();
    let validation = ModelSchema.validate(device, deviceUpdateSchema);
    if (validation.errors !== null) {
      return handleApiError(res, new ApiError(ErrorCode.VALIDATION, "Validation Error.", validation.errors));
    }

    // Check existing device and valid orgId. Execute in parallel. 
    let existingDevicePromise = deviceRepo.getDevice(req.params.deviceId);
    let newOrgPromise = orgRepo.getById(device.orgId);
    let existingDevice = await existingDevicePromise;
    let newOrg = await newOrgPromise;

    if (!existingDevice) {
      return handleApiError(res, new ApiError(ErrorCode.RESOURCE_NOT_FOUND, "Device not found."));
    }
    if (!newOrg) {
      return handleApiError(res, 
        new ApiError(
          ErrorCode.VALIDATION,
          "Validation Error.",
          [new ApiErrorField("orgId", "Invalid organization.", ValidationCode.RESOURCE_NOT_FOUND)]));
    }

    // Authorization - Only superusers with write access and org users with write access to this org is authorized to update the device.
    let authUser = req.user;
    if (authUser.accessRight === AccessRight.READ || (authUser.role === Role.ORG && !authUser.orgs.includes(existingDevice.orgId.toHexString()))) {
      return handleApiError(res, new UnauthorizedApiError("You are not authorized to update this device."));
    }
    // Make sure the user has authorization to the new organization as well
    if (authUser.role === Role.ORG && !authUser.orgs.includes(newOrg._id.toHexString())) {
      return handleApiError(res, new UnauthorizedApiError("You are not authorized on the new organization."));
    }
    
    if (existingDevice.orgId != device.orgId) {
      // Apply new organisation's backup settings
      device.backupSettings = newOrg.backupSettings;
    }
    
    await deviceRepo.updateById(existingDevice._id, device);
    return res.json({ message: "Device updated successfully." });

  } catch (err) {
    next(err);
  }
});

router.delete("/:deviceId", async (req, res, next) => {
  try {
    let device = await deviceRepo.getDevice(req.params.deviceId);
    if (!device) {
      return handleApiError(res, new ApiError(ErrorCode.RESOURCE_NOT_FOUND, "Device not found."));
    }
    // Authorization - Only superusers with write access and org users with write access to the org is authorized to delete the device.
    let authUser = req.user;
    if (authUser.accessRight === AccessRight.READ || (authUser.role === Role.ORG && !authUser.orgs.includes(device.orgId))) {
      return handleApiError(res, new UnauthorizedApiError("You are not authorized to delete this device."));
    }
    // Deny delete if the device is currently online
    if (device.online) {
      return handleApiError(res,
        new ApiError(ErrorCode.INVALID_ARGUMENT, "The device is currently online, device delete is only supported on offline devices."));
    }
    // Delete device
    await deviceRepo.removeById(device._id);
    return res.json({ message: "Device deleted." });
  } catch (err) {
    next(err);
  }
});

router.get("/", async (req, res, next) => {
  try {
    let result;
    if (req.user.role === Role.SUPER) {
      result = await deviceRepo.getAll();
    } else {
      result = await deviceRepo.getAllInOrgIdArray(toObjectIdArray(req.user.orgs));
    }
    return res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;