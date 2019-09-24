const express = require("express");
const router = express.Router({ mergeParams: true });
const grpcServer = require("../../whub-server/whub-server");
const fileRepo = require("../../services/file-repo");
const { authorize } = require("../../services/auth");
const { handleApiResult, ApiError, handleApiError, ErrorCode } = require("../../services/errors");

// Setup authorization middleware
router.use(authorize());

router.get("/backup/:backupId", async (req, res, next) => {
  try {
    const { deviceId, backupId } = req.params;
    // Make sure this backup ID actually belongs to this device
    let file = await fileRepo.getDeviceBackupFile(deviceId, backupId);
    if (!file) {
      return handleApiError(res, new ApiError(ErrorCode.RESOURCE_NOT_FOUND, "Invalid backup ID."));
    }
    let fileStream = fileRepo.getDeviceBackupDownloadStream(req.params.backupId);
    res.set({
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename=${file.filename}`,
      "Content-Length": file.length
    });
    fileStream.pipe(res)
      .on("error", (error) => {
        return next(error);
      });
  } catch (err) {
    next(err);
  }
});

router.get("/backup", async (req, res, next) => {
  try {
    let backupFiles = await fileRepo.getAllDeviceBackupFiles(req.params.deviceId);
    let result = backupFiles.map(x => {
      x.version = x.metadata.version;
      delete x.metadata;
      return x;
    });
    return res.json(result);
  } catch (err) {
    next(err);
  }
});


router.post("/backup", async (req, res, next) => {
  try {
    let result = await grpcServer.startBackup(req.params.deviceId, false);
    return handleApiResult(res, result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;