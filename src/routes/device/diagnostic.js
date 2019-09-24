const express = require("express");
const router = express.Router({ mergeParams: true });
const grpcServer = require("../../whub-server/whub-server");
const { authorize } = require("../../services/auth");
const { handleApiResult } = require("../../services/errors");

// Setup authorization middleware
router.use(authorize());

router.get("/log/:level", async (req, res, next) => {
  try {
    let result = await grpcServer.getDiagnosticLog(req.params.deviceId, req.params.level);
    return handleApiResult(res, result);
  } catch (err) {
    next(err);
  }
});

router.get("/health", async (req, res, next) => {
  try {
    let result = await grpcServer.getDiagnosticHealth(req.params.deviceId);
    return handleApiResult(res, result);
  } catch (err) {
    next(err);
  }
});

router.get("/benchmark", async (req, res, next) => {
  try {
    let result = await grpcServer.getDiagnosticBenchmark(req.params.deviceId);
    return handleApiResult(res, result);
  } catch (err) {
    next(err);
  }
});

router.post("/benchmark", async (req, res, next) => {
  try {
    let result = await grpcServer.scheduleDiagnosticBenchmark(req.params.deviceId);
    return handleApiResult(res, result);
  } catch (err) {
    next(err);
  }
});

router.get("/netstat", async (req, res, next) => {
  try {
    let result = await grpcServer.getDiagnosticNetstat(req.params.deviceId);
    return handleApiResult(res, result);
  } catch (err) {
    next(err);
  }
});

router.get("/ping/:hostIp", async (req, res, next) => {
  try {
    let ipv6 = !!parseInt(req.query.ipv6);
    let count = parseInt(req.query.count);
    if (isNaN(count) || count < 1 || count > 10) {
      count = 1;
    }
    let result = await grpcServer.getDiagnosticPing(req.params.deviceId, req.params.hostIp, ipv6, count);
    return handleApiResult(res, result);
  } catch (err) {
    next(err);
  }
});

router.get("/traceroute/:hostIp", async (req, res, next) => {
  try {
    let hops = parseInt(req.query.hops);
    if (isNaN(hops) || hops < 1 || hops > 64) {
      hops = 64;
    }
    let ipv6 = !!parseInt(req.query.ipv6);
    let icmp = !!parseInt(req.query.icmp);
    let lookup = !!parseInt(req.query.lookup);
    
    let result = await grpcServer.getDiagnosticTraceroute(req.params.deviceId, req.params.hostIp, hops, ipv6, icmp, lookup);
    return handleApiResult(res, result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;