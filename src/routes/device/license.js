const express = require("express");
const router = express.Router({ mergeParams: true });
const { authorize } = require("../../services/auth");
const grpcServer = require("../../whub-server/whub-server");
const { handleApiResult, handleApiError, InvalidArgumentApiError } = require("../../services/errors");

// Setup authorization middleware
router.use(authorize());

router.get("/", async (req, res, next) => {
  try {
    let result = await grpcServer.getLicense(req.params.deviceId);
    return handleApiResult(res, result);
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
  	let param = req.body;
  	if (!param || !param.token || !param.license) {
  		return handleApiError(res, new InvalidArgumentApiError('license', 'can\'t be empty'));
  	}

    let result = await grpcServer.addLicense(req.params.deviceId, param.license, param.token);
    return handleApiResult(res, result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;