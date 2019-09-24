const express = require("express");
const router = express.Router();
const ObjectId = require("mongodb").ObjectId;
const toObjectIdArray = require("../utils/helpers").toObjectIdArray;
const deviceRepo = require("../services/device-repo");
const orgRepo = require("../services/org-repo");
const { Role } = require("../services/auth-roles");
const { authorize } = require("../services/auth");

// Setup authorization middleware
router.use(authorize());

router.get("/", async (req, res, next) => {
  try {
    let getAllPromise = req.user.role === Role.SUPER ? orgRepo.getAll() : orgRepo.getAllInIdArray(toObjectIdArray(req.user.orgs));
    let [userFirstOrgId] = req.user.orgs;
    let defaultOrgId = userFirstOrgId ? new ObjectId(userFirstOrgId) : orgRepo.getDefaultOrgId();

    let [orgs, devices, stats] = await Promise.all([
      getAllPromise,
      deviceRepo.getDevicesForOrg(defaultOrgId),
      deviceRepo.getDevicesStatsForOrg(defaultOrgId)
    ]);
    orgs.map(x => {
      x.userCount = x.users.length;
      x.deviceCount = x.devices.length;
      return x;
    });
    let defaultOrg = orgs.find(x => defaultOrgId.equals(x._id));
    let bootstrap = {
      orgs: orgs,
      devices: devices,
      stats: stats,
      activeOrg: defaultOrg
    };
    res.json(bootstrap);
  } catch (err) {
    next(err);
  }
});

module.exports = router;