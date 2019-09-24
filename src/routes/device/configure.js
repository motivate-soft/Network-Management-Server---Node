const express = require("express");
const router = express.Router({ mergeParams: true });
const grpcServer = require("../../whub-server/whub-server");
const { authorize } = require("../../services/auth");
const { handleApiResult, handleApiError, ApiError, ErrorCode } = require("../../services/errors");
const { ModelSchema } = require("../../services/validation");
const deviceRepo = require("../../services/device-repo");

// Setup authorization middleware
router.use(authorize());

router.get("/settings/system", async (req, res, next) => {
  try {
    let result = await grpcServer.getSystemSettings(req.params.deviceId);
    return handleApiResult(res, result);
  } catch (err) {
    next(err);
  }
});

router.post("/settings/system", async (req, res, next) => {
  try {
    let settings = req.body;
    let result = await grpcServer.updateSystemSettings(req.params.deviceId, settings);
    return handleApiResult(res, result);
  } catch (err) {
    next(err);
  }
});

router.get("/settings/network", async (req, res, next) => {
  try {
    let result = await grpcServer.getNetworkSettings(req.params.deviceId);
    return handleApiResult(res, result);
  } catch (err) {
    next(err);
  }
});

router.post("/settings/network", async (req, res, next) => {
  try {
    let settings = req.body;
    let result = await grpcServer.updateNetworkSettings(req.params.deviceId, settings);
    return handleApiResult(res, result);
  } catch (err) {
    next(err);
  }
});

router.get("/settings/optimization", async (req, res, next) => {
  try {
    let result = await grpcServer.getOptimizationSettings(req.params.deviceId);
    return handleApiResult(res, result);
  } catch (err) {
    next(err);
  }
});

router.post("/settings/optimization", async (req, res, next) => {
  try {
    let settings = req.body;
    let result = await grpcServer.updateOptimizationSettings(req.params.deviceId, settings);
    return handleApiResult(res, result);
  } catch (err) {
    next(err);
  }
});

router.get("/settings/monitoring", async (req, res, next) => {
  try {
    let result = await grpcServer.getMonitorSettings(req.params.deviceId);
    return handleApiResult(res, result);
  } catch (err) {
    next(err);
  }
});

router.post("/settings/monitoring", async (req, res, next) => {
  try {
    let settings = req.body;
    let result = await grpcServer.updateMonitorSettings(req.params.deviceId, settings);
    return handleApiResult(res, result);
  } catch (err) {
    next(err);
  }
});

router.delete("/tunnels/:ruleId", async (req, res, next) => {
  try {
    let result = await grpcServer.deleteTunnelPoliciesRule(req.params.deviceId, req.params.ruleId);
    return handleApiResult(res, result);
  } catch (err) {
    next(err);
  }
});

router.put("/tunnels/:ruleId", async (req, res, next) => {
  try {
    let tunnelRule = req.body;
    let result = await grpcServer.updateTunnelPoliciesRule(req.params.deviceId, tunnelRule);
    return handleApiResult(res, result);
  } catch (err) {
    next(err);
  }
});

router.post("/tunnels", async (req, res, next) => {
  try {
    let tunnelRule = req.body;
    let result = await grpcServer.addTunnelPoliciesRule(req.params.deviceId, tunnelRule);
    return handleApiResult(res, result);
  } catch (err) {
    next(err);
  }
});

router.get("/tunnels", async (req, res, next) => {
  try {
    let result = await grpcServer.getTunnelPolicies(req.params.deviceId);
    return handleApiResult(res, result);
  } catch (err) {
    next(err);
  }
});

router.delete("/traffic/:ruleId", async (req, res, next) => {
  try {
    let result = await grpcServer.deleteTrafficPolicy(req.params.deviceId, req.params.ruleId);
    return handleApiResult(res, result);
  } catch (err) {
    next(err);
  }
});

router.put("/traffic/:ruleId", async (req, res, next) => {
  try {
    let trafficPolicy = req.body;
    let result = await grpcServer.updateTrafficPolicy(req.params.deviceId, trafficPolicy);
    return handleApiResult(res, result);
  } catch (err) {
    next(err);
  }
});

router.post("/traffic", async (req, res, next) => {
  try {
    let trafficPolicy = req.body;
    let result = await grpcServer.addTrafficPolicy(req.params.deviceId, trafficPolicy);
    return handleApiResult(res, result);
  } catch (err) {
    next(err);
  }
});

router.get("/traffic", async (req, res, next) => {
  try {
    let result = await grpcServer.getTrafficPolicies(req.params.deviceId);
    return handleApiResult(res, result);
  } catch (err) {
    next(err);
  }
});

router.post("/paths/config", async (req, res, next) => {
  try {
    let result = await grpcServer.setPathConfig(req.params.deviceId, req.body);
    return handleApiResult(res, result);
  } catch (err) {
    next(err);
  }
});

router.get("/paths/config", async (req, res, next) => {
  try {
    let result = await grpcServer.getPathConfig(req.params.deviceId);
    return handleApiResult(res, result);
  } catch (err) {
    next(err);
  }
});

router.get("/paths/gateways", async (req, res, next) => {
  try {
    let result = await grpcServer.getPathGateways(req.params.deviceId);
    return handleApiResult(res, result);
  } catch (err) {
    next(err);
  }
});

router.delete("/paths/gateways/:type(primary|secondary)", async (req, res, next) => {
  try {
    let result = await grpcServer.removePathGateway(req.params.deviceId, req.params.type);
    return handleApiResult(res, result);
  } catch (err) {
    next(err);
  }
});

router.post("/reset/counter/:kind", async (req, res, next) => {
  try {
    let result = await grpcServer.resetService(req.params.deviceId, req.params.kind);
    if (!result.error && req.params.kind.toLowerCase() === "service") {
      await deviceRepo.setReconfigure(req.params.deviceId, false);
    }
    return handleApiResult(res, result);
  } catch (err) {
    next(err);
  }
});

router.post("/reset/device/:kind", async (req, res, next) => {
  try {
    let result = await grpcServer.resetService(req.params.deviceId, req.params.kind);
    return handleApiResult(res, result);
  } catch (err) {
    next(err);
  }
});

router.post("/reset/password", async (req, res, next) => {
  try {
    let schema = new ModelSchema({
      newPassword: ModelSchema.string().required().max(128),
      confirmPass: ModelSchema.string().required().max(128).compare("newPassword")
    });
    let validation = ModelSchema.validate(req.body, schema);
    if (validation.errors !== null) {
      return handleApiError(res, new ApiError(ErrorCode.VALIDATION, "Validation Error.", validation.errors));
    }
    let result = await grpcServer.changeSshPassword(req.params.deviceId, req.body.newPassword);
    return handleApiResult(res, result);
  } catch (err) {
    next(err);
  }
});

router.get("/routes", async (req, res, next) => {
  try {
    let result = await grpcServer.getRoutes(req.params.deviceId);
    return handleApiResult(res, result);
  } catch (err) {
    next(err);
  }
});

router.post("/routes", async (req, res, next) => {
  try {
    let route = req.body;
    let result = await grpcServer.addRoute(req.params.deviceId, route);
    return handleApiResult(res, result);
  } catch (err) {
    next(err);
  }
});

router.put("/routes/:ruleId", async (req, res, next) => {
  try {
    let route = req.body;
    route.ruleId = req.params.ruleId;
    let result = await grpcServer.updateRoute(req.params.deviceId, route);
    return handleApiResult(res, result);
  } catch (err) {
    next(err);
  }
});

router.delete("/routes/:ruleId", async (req, res, next) => {
  try {
    let result = await grpcServer.removeRoute(req.params.deviceId, req.params.ruleId);
    return handleApiResult(res, result);
  } catch (err) {
    next(err);
  }
});

router.get("/webcache", async (req, res, next) => {
  try {
    let result = await grpcServer.getWebcacheConfig(req.params.deviceId);
    return handleApiResult(res, result);
  } catch (err) {
    next(err);
  }
});

router.get("/tcpx", async (req, res, next) => {
  try {
    let result = await grpcServer.getTcpxRules(req.params.deviceId);
    return handleApiResult(res, result);
  } catch (err) {
    next(err);
  }
});

router.post("/webcache", async (req, res, next) => {
  try {
    let result = await grpcServer.setWebcacheConfig(req.params.deviceId, req.body);
    return handleApiResult(res, result);
  } catch (err) {
    next(err);
  }
});

router.post("/tcpx", async (req, res, next) => {
  try {
    let result = await grpcServer.addTcpxRule(req.params.deviceId, req.body);
    return handleApiResult(res, result);
  } catch (err) {
    next(err);
  }
});

router.put("/tcpx/:ruleId(\\d+)", async (req, res, next) => {
  try {
    let result = await grpcServer.updateTcpxRule(req.params.deviceId, req.params.ruleId, req.body);
    return handleApiResult(res, result);
  } catch (err) {
    next(err);
  }
});

router.delete("/tcpx/:ruleId(\\d+)", async (req, res, next) => {
  try {
    let result = await grpcServer.removeTcpxRule(req.params.deviceId, req.params.ruleId);
    return handleApiResult(res, result);
  } catch (err) {
    next(err);
  }
});

router.put("/tcpx/:ruleId(\\d+)/move", async (req, res, next) => {
  try {
    let result = await grpcServer.moveTcpxRule(req.params.deviceId, req.params.ruleId, req.query.upward);
    return handleApiResult(res, result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;