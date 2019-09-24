const express = require("express");
const router = express.Router({ mergeParams: true });
const grpcServer = require("../../whub-server/whub-server");
const { authorize } = require("../../services/auth");
const { handleApiResult } = require("../../services/errors");

// Setup authorization middleware
router.use(authorize());

const getWebcacheWeekResult = async (methodName, req) => {
  return await grpcServer[methodName](
    req.params.deviceId,
    req.params.year,
    0,
    0,
    req.params.week,
    req.query.orderBy);
};

const getWebcacheDateResult = async (methodName, req) => {
  return await grpcServer[methodName](
    req.params.deviceId,
    req.params.year,
    req.params.month,
    req.params.day,
    0,
    req.query.orderBy);
};

router.get("/dates", async (req, res, next) => {
  try {
    let result = await grpcServer.getWebcacheDates(req.params.deviceId);
    return handleApiResult(res, result);
  } catch (err) {
    next(err);
  }
});

router.get("/totals/week/:year/:week", async (req, res, next) => {
  try {
    let result = await getWebcacheWeekResult("getWebcacheTotals", req);
    return handleApiResult(res, result);
  } catch (err) {
    next(err);
  }
});

router.get("/totals/:year/:month?/:day?", async (req, res, next) => {
  try {
    let result = await getWebcacheDateResult("getWebcacheTotals", req);
    return handleApiResult(res, result);
  } catch (err) {
    next(err);
  }
});

router.get("/domains/week/:year/:week", async (req, res, next) => {
  try {
    let result = await getWebcacheWeekResult("getWebcacheDomains", req);
    return handleApiResult(res, result);
  } catch (err) {
    next(err);
  }
});

router.get("/domains/:year/:month?/:day?", async (req, res, next) => {
  try {
    let result = await getWebcacheDateResult("getWebcacheDomains", req);
    return handleApiResult(res, result);
  } catch (err) {
    next(err);
  }
});

router.get("/urls/week/:year/:week", async (req, res, next) => {
  try {
    let result = await getWebcacheWeekResult("getWebcacheUrls", req);
    return handleApiResult(res, result);
  } catch (err) {
    next(err);
  }
});

router.get("/urls/:year/:month?/:day?", async (req, res, next) => {
  try {
    let result = await getWebcacheDateResult("getWebcacheUrls", req);
    return handleApiResult(res, result);
  } catch (err) {
    next(err);
  }
});

router.get("/denied/week/:year/:week", async (req, res, next) => {
  try {
    let result = await getWebcacheWeekResult("getWebcacheDenied", req);
    return handleApiResult(res, result);
  } catch (err) {
    next(err);
  }
});

router.get("/denied/:year/:month?/:day?", async (req, res, next) => {
  try {
    let result = await getWebcacheDateResult("getWebcacheDenied", req);
    return handleApiResult(res, result);
  } catch (err) {
    next(err);
  }
});

router.get("/users/detail/:user/week/:year/:week", async (req, res, next) => {
  try {
    let result = await grpcServer.getWebcacheUserDetail(
      req.params.deviceId,
      req.params.user,
      req.params.year,
      0,
      0,
      req.params.week,
      req.query.orderBy);
    return handleApiResult(res, result);
  } catch (err) {
    next(err);
  }
});

router.get("/users/detail/:user/:year/:month?/:day?", async (req, res, next) => {
  try {
    let result = await grpcServer.getWebcacheUserDetail(
      req.params.deviceId,
      req.params.user,
      req.params.year,
      req.params.month,
      req.params.day,
      0,
      req.query.orderBy);
    return handleApiResult(res, result);
  } catch (err) {
    next(err);
  }
});

router.get("/users/week/:year/:week", async (req, res, next) => {
  try {
    let result = await getWebcacheWeekResult("getWebcacheUsers", req);
    return handleApiResult(res, result);
  } catch (err) {
    next(err);
  }
});

router.get("/users/:year/:month?/:day?", async (req, res, next) => {
  try {
    let result = await getWebcacheDateResult("getWebcacheUsers", req);
    return handleApiResult(res, result);
  } catch (err) {
    next(err);
  }
});

router.get("/networks/detail/:network/week/:year/:week", async (req, res, next) => {
  try {
    let result = await grpcServer.getWebcacheNetworkDetail(
      req.params.deviceId,
      req.params.network,
      req.params.year,
      0,
      0,
      req.params.week,
      req.query.orderBy);
    return handleApiResult(res, result);
  } catch (err) {
    next(err);
  }
});


router.get("/networks/detail/:network/:year/:month?/:day?", async (req, res, next) => {
  try {
    let result = await grpcServer.getWebcacheNetworkDetail(
      req.params.deviceId,
      req.params.network,
      req.params.year,
      req.params.month,
      req.params.day,
      0,
      req.query.orderBy);
    return handleApiResult(res, result);
  } catch (err) {
    next(err);
  }
});

router.get("/networks/week/:year/:week", async (req, res, next) => {
  try {
    let result = await getWebcacheWeekResult("getWebcacheNetworks", req);
    return handleApiResult(res, result);
  } catch (err) {
    next(err);
  }
});

router.get("/networks/:year/:month?/:day?", async (req, res, next) => {
  try {
    let result = await getWebcacheDateResult("getWebcacheNetworks", req);
    return handleApiResult(res, result);
  } catch (err) {
    next(err);
  }
});

router.get("/mimetypes/week/:year/:week", async (req, res, next) => {
  try {
    let result = await getWebcacheWeekResult("getWebcacheMimeTypes", req);
    return handleApiResult(res, result);
  } catch (err) {
    next(err);
  }
});

router.get("/mimetypes/:year/:month?/:day?", async (req, res, next) => {
  try {
    let result = await getWebcacheDateResult("getWebcacheMimeTypes", req);
    return handleApiResult(res, result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;