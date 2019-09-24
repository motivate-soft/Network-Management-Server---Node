const express = require("express");
const router = express.Router({ mergeParams: true });
const deviceRepo = require("../services/device-repo");
const { authorize } = require("../services/auth");

// Setup authorization middleware
router.use(authorize());

router.get("/", async (req, res, next) => {
  try {
    let devices = await deviceRepo.getDevicesForOrg(req.params.orgId);
    res.json(devices);
  } catch (err) {
    next(err);
  }
});

module.exports = router;