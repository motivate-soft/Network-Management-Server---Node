const express = require("express");
const router = express.Router({ mergeParams: true });
const grpcServer = require("../../whub-server/whub-server");
const { authorize } = require("../../services/auth");
const { handleApiResult } = require("../../services/errors");

// Setup authorization middleware
router.use(authorize());

router.get("/memory/:period", async (req, res, next) => {
  try {
    let result = await grpcServer.getSystemMemory(req.params.deviceId, req.params.period);
    return handleApiResult(res, result);
  } catch (err) {
    next(err);
  }
});

router.get("/load/:period", async (req, res, next) => {
  try {
    let result = await grpcServer.getSystemLoad(req.params.deviceId, req.params.period);
    return handleApiResult(res, result);
  } catch (err) {
    next(err);
  }
});

router.get("/cpu/:period", async (req, res, next) => {
  try {
    let result = await grpcServer.getSystemCpu(req.params.deviceId, req.params.period);
    return handleApiResult(res, result);
  } catch (err) {
    next(err);
  }
});

router.get("/disk/load/:period", async (req, res, next) => {
  try {
    let result = await grpcServer.getSystemDiskLoad(req.params.deviceId, req.params.period);
    return handleApiResult(res, result);
  } catch (err) {
    next(err);
  }
});

router.get("/disk/space/:period", async (req, res, next) => {
  try {
    let result = await grpcServer.getSystemDiskSpace(req.params.deviceId, req.params.period);
    return handleApiResult(res, result);
  } catch (err) {
    next(err);
  }
});

router.get("/info", async (req, res, next) => {
  try {
    let result = await grpcServer.getSystemInfo(req.params.deviceId);
    return handleApiResult(res, result);
  } catch (err) {
    next(err);
  }
});

router.get("/indicators", async (req, res, next) => {
  try {
    let result = await grpcServer.getSystemIndicators(req.params.deviceId);
    return handleApiResult(res, result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;