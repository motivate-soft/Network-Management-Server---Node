const express = require("express");
const router = express.Router({ mergeParams: true });
const grpcServer = require("../../whub-server/whub-server");
const { authorize } = require("../../services/auth");

// Setup authorization middleware
router.use(authorize());

router.get("/protocols/:peerOutput?", async (req, res, next) => {
  try {
    let report = await grpcServer.getDashboardTopPorts(req.params.deviceId, 3600, 10, req.params.peerOutput);
    res.json(report.protocolList);
  } catch (err) {
    next(err);
  }
});

router.get("/:peerOutput?", async (req, res, next) => {
  try {
    let report = await grpcServer.getDashboardData(req.params.deviceId, req.params.peerOutput);
    res.json(report);
  } catch (err) {
    next(err);
  }
});

module.exports = router;