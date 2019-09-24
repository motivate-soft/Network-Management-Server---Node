const express = require("express");
const router = express.Router({ mergeParams: true });
const auth = require("../services/auth");
const network = require("../services/network");
const logger = require("../utils/logger");
const { InvalidArgumentApiError, ErrorCode, ApiError, handleApiError } = require("../services/errors");
let { db } = require('../services/db');
let { deleteDeviceBackupFile } = require('../services/file-repo')

// Setup authorization middleware
router.use(auth.authorize());

router.post("/admin/reboot", async (req, res, next) => {
	await exec(WCM_SCRIPT_PATH + ' -reboot');
	res.json({status: 'ok'});
});

router.post("/admin/poweroff", async (req, res, next) => {
	await exec(WCM_SCRIPT_PATH + ' -poweroff');
	res.json({status: 'ok'});
});

router.post("/admin/factory-reset", async (req, res, next) => {
	try {
		// set DHCP by default
		let configSet = await network.getConfiguration();
		for (let cfg of configSet) {
			cfg.dhcp = true;
		}
		await network.setConfiguration(configSet);
	} finally {
		// remove backup files already created
		let backupFiles = await db.collection('deviceBackup.files')
			.find()
			.project({
		    _id: 1
		  })
		  .toArray();

		for (let backupFile of backupFiles) {
			try {
				await deleteDeviceBackupFile(backupFile._id);
			} catch(e) {
				logger.warn(e);
			}
		}

		// cleanup DB and create collection with seed data
		await db.truncate();
		await db.setupDefaultCollections();
	}

	res.json({status: 'ok'});
});

router.get("/network", async (req, res, next) => {
  try {
  	interfaces = await network.getConfiguration();

  	res.json(interfaces);
  } catch (err) {
    next(err);
  }
});

router.post("/network", async (req, res, next) => {
	try {
		let netCfg = req.body.network;

		await network.setConfiguration(netCfg);
	} catch (e) {
		return handleApiError(res, new ApiError(ErrorCode.SERVICE_UNAVAILABLE, e.message));
	}

	res.json({status: 'ok'});
});

module.exports = router;