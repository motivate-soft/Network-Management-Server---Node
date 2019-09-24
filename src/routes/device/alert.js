const express = require("express");
const router = express.Router({ mergeParams: true });
const { authorize } = require("../../services/auth");
const deviceRepo = require("../../services/device-repo");
const grpcServer = require("../../whub-server/whub-server");

// Setup authorization middleware
router.use(authorize());

router.get("/", async (req, res, next) => {
  try {
    let result = await deviceRepo.getAlert(req.params.deviceId);
    return res.json(result.alert || {});
  } catch (err) {
    next(err);
  }
});

const ErrorLineRegex = /^\[([A-Za-z]{3} [A-Za-z]{3}[\s]+[\d]+ [\d]{2}:[\d]{2}:[\d]{2} [\d]{4})\] : Error :/;
router.post("/dismiss-error", async (req, res, next) => {
	try {
		let result = await grpcServer.getDiagnosticLog(req.params.deviceId, 'error');
		result.reverse().find((line) => {
			let res;
			if (line && (res = line.match(ErrorLineRegex))) {
		    deviceRepo.dismissErrorsBefore(req.params.deviceId, new Date(res[1]));
		    deviceRepo.setErrorAlert(req.params.deviceId, false);
				return true;
			}
			return false;
		});
		res.json({status: 'ok'});
	} catch (e) {
		next(e);
	}
});

module.exports = router;