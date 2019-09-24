const express = require("express");
const router = express.Router({ mergeParams: true });
const grpcServer = require("../../whub-server/whub-server");
const { authorize } = require("../../services/auth");
const { handleApiResult } = require("../../services/errors");

// Setup authorization middleware
router.use(authorize());

router.get("/protocols", async (req, res, next) => {
  try {
    let result = await grpcServer.getNetworkApplications(req.params.deviceId);
    return handleApiResult(res, result);
  } catch (err) {
    next(err);
  }
});

router.get("/sessions/:src/:dst", async (req, res, next) => {
  try {
    let filterOptions = {
      source: req.params.src,
      destination: req.params.dst,
      ...req.query
    };
    let result = await grpcServer.getNetworkSessionDetail(req.params.deviceId, filterOptions);
    return handleApiResult(res, result);
  } catch (err) {
    next(err);
  }
});

router.get("/sessions", async (req, res, next) => {
  try {
    let result = await grpcServer.getNetworkSessions(req.params.deviceId, req.query);
    return handleApiResult(res, result);
  } catch (err) {
    next(err);
  }
});

router.get("/applications", async (req, res, next) => {
  try {
    let result = await grpcServer.getNetworkTopApplications(req.params.deviceId, req.query);
    return handleApiResult(res, result);
  } catch (err) {
    next(err);
  }
});

router.get("/peerstatus", async (req, res, next) => {
  try {
    let result = await grpcServer.getNetworkPeers(req.params.deviceId);
    return handleApiResult(res, result);
  } catch (err) {
    next(err);
  }
});

router.delete("/peerstatus/:peerIp", async (req, res, next) => {
  try {
    let result = await grpcServer.deleteNetworkPeer(req.params.deviceId, req.params.peerIp);
    return handleApiResult(res, result);
  } catch (err) {
    next(err);
  }
});

router.get("/traffic/:period", async (req, res, next) => {
  try {
    let result = await grpcServer.getNetworkInterfaceTraffic(req.params.deviceId, req.params.period);
    return handleApiResult(res, result);
  } catch (err) {
    next(err);
  }
});

router.get("/optimization/lan/wan/:period", async (req, res, next) => {
  try {
    let result = await grpcServer.getNetworkOptimizationLanToWan(req.params.deviceId, req.params.period, req.query.peer ? req.query.peer : "");
    return handleApiResult(res, result);
  } catch (err) {
    next(err);
  }
});

router.get("/optimization/wan/lan/:period", async (req, res, next) => {
  try {
    let result = await grpcServer.getNetworkOptimizationWanToLan(req.params.deviceId, req.params.period, req.query.peer ? req.query.peer : "");
    return handleApiResult(res, result);
  } catch (err) {
    next(err);
  }
});

router.get("/optimization/passthrough/:period", async (req, res, next) => {
  try {
    let result = await grpcServer.getNetworkOptimizationPassThrough(req.params.deviceId, req.params.period);
    return handleApiResult(res, result);
  } catch (err) {
    next(err);
  }
});

router.get("/optimization/ratios/:period", async (req, res, next) => {
  try {
    let result = await grpcServer.getNetworkOptimizationRatios(req.params.deviceId, req.params.period, req.query.peer ? req.query.peer : "");
    return handleApiResult(res, result);
  } catch (err) {
    next(err);
  }
});

router.get("/qos/:period", async (req, res, next) => {
  try {
    let result = await grpcServer.getNetworkQosReport(req.params.deviceId, req.params.period, req.query.class);
    return handleApiResult(res, result);
  } catch (err) {
    next(err);
  }
});

router.get("/interfaces", async (req, res, next) => {
  try {
    let result = await grpcServer.getNetworkInterfaces(req.params.deviceId);
    return handleApiResult(res, result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;