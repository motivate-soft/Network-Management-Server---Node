const fs = require("fs");
const path = require("path");
const config = require("../config/config");
const messages = require("./grpc/maintenance_pb");
const { ObjectId } = require("mongodb");
const { setupRpcCall, setupRpcMethodPromise } = require("./rpc-helpers");
const { getFileHash } = require("../utils/helpers");
const fileRepo = require("../services/file-repo");
const orgRepo = require("../services/org-repo");
const deviceRepo = require("../services/device-repo");
const logger = require("../utils/logger");

class MaintenanceController {
  constructor() {}

  rpcUploadBackup(call, callback) {
    let metadata = call.metadata.getMap();
    let deviceId = metadata.id;
    let uniqueId = new ObjectId();
    let tmpFile = path.join(config.tmpPath, `${deviceId}-${uniqueId.toHexString()}.backupcfg.tar`);

    const cleanup = () => {
      if (fs.existsSync(tmpFile)) {
        fs.unlinkSync(tmpFile);
      }
    };

    try {
      let fileStream = fs.createWriteStream(tmpFile);
      let backupInfo = null;

      fileStream.on("ready", () => {
        call.on("data", (uploadData) => {
          if (uploadData.hasBackupInfo()) {
            backupInfo = uploadData.getBackupInfo().toObject();
          }
          if (uploadData.hasChunk()) {
            let chunk = uploadData.getChunk().getData();
            fileStream.write(chunk);
          }
        });
        call.on("end", async () => {
          fileStream.once("finish", async () => {
            try {
              if (!backupInfo) {
                throw new Error("No backup info received.");
              }
              logger.info(`Backup uploaded ${backupInfo.fileInfo.name}`, backupInfo);
              await this._verifyFile(tmpFile, backupInfo.fileInfo);
              let fileId = await fileRepo.saveDeviceBackupFile(deviceId, tmpFile, backupInfo.fileInfo.name, backupInfo.version);
              logger.info(`Backup file saved to DB with ID: ${fileId}`);
              // If this backup was scheduled via BackupScheduler then we need to update the nextBackupTime schedule.
              if (backupInfo.updateSchedule) {
                let device = await deviceRepo.getDeviceOrgId(deviceId);
                let org = await orgRepo.getBackupSettings(device.orgId);
                logger.info(`Setting next backup time for device ${device._id.toHexString()} to ${org.backupSettings.nextBackupTime}.`);
                await deviceRepo.setNextBackupTime(device._id, org.backupSettings.nextBackupTime);
              }
            } catch (error) {
              logger.error("rpcUploadBackup ERROR:", error);
            } finally {
              cleanup();
            }
            let response = new messages.UploadBackupResponse();
            return callback(null, response);
          });
          fileStream.end();
        });
        call.on("error", async (error) => {
          throw error;
        });
      });
    } catch (error) {
      logger.error("rpcUploadBackup ERROR:", error);
      cleanup();
    }
  }

  rpcStartBackup(call) {
    setupRpcCall(call, "rpcStartBackup");
  }

  startBackup(id, updateSchedule = false) {
    const getRequest = () => {
      let request = new messages.StartBackupRequest();
      request.setUpdateSchedule(updateSchedule);
      return request;
    };
    const formatData = (data) => {
      return data.hasError() ? data.toObject() : { message: "Backup scheduled." };
    };
    return setupRpcMethodPromise(id, "rpcStartBackup", getRequest, formatData);
  }

  async _verifyFile(localFile, fileInfo) {
    logger.info(`Verifying file ${localFile}`);
    let fileStat = fs.statSync(localFile);
    if (fileStat.size !== fileInfo.size) {
      throw new Error(`Invalid file size. Expected ${fileInfo.size}, got ${fileStat.size}`);
    }
    // Verify hash
    let hash = await getFileHash(localFile, fileInfo.hashAlgo);
    if (hash !== fileInfo.hash) {
      throw new Error(`Invalid file hash. Expected ${fileInfo.hash}, got ${hash}`);
    }
  }
}



module.exports = {
  MaintenanceController
};