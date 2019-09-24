const orgRepo = require("./org-repo");
const deviceRepo = require("./device-repo");
const fileRepo = require("./file-repo");
const grpcServer = require("../whub-server/whub-server");
const logger = require("../utils/logger");

// Every 30 minutes
const MsInterval = 1000 * 60 * 30;

class BackupScheduler {
  constructor(backupRetention) {
    this._backupRetention = backupRetention;
    this._intervalTimeout = null;
  }

  cleanup() {
    if (this._intervalTimeout) {
      clearInterval(this._intervalTimeout);
    }
  }

  initialize() {
    let now = new Date();
    let nextHour = new Date();
    nextHour.setHours(now.getHours() + 1, 0, 0, 0);
    //let diff = nextHour - now;
    // TODO FIXME
    let diff = 1;
    setTimeout(() => {
      this.startInterval();
    }, diff);
  }

  startInterval() {
    this._intervalTimeout = setInterval(() => {
      this.runBackups();
    }, MsInterval);
    // The above interval will only be called in an hour, so kickoff the first backup manually.
    this.runBackups();
  }

  async runBackups() {
    logger.info("Running backups....");
    let now = new Date();
    let orgs = await orgRepo.getAllThatRequireBackup(now);
    for (let org of orgs) {
      await orgRepo.updateNextBackupTimeForOrgOnly(org._id, org.backupSettings, now);
    }

    let devices = await deviceRepo.getAllThatRequireBackup(now);
    for (let device of devices) {
      try {

        let backups = await fileRepo.getAllDeviceBackupFiles(device._id, fileRepo.FileSort.UPLOAD_DATE_ASCENDING);
        while (backups.length >= this._backupRetention) {
          let backup = backups.shift();
          logger.info(`Deleting backup file for retention policy ${backup.filename} ${backup._id.toHexString()}`);
          await fileRepo.deleteDeviceBackupFile(backup._id);
        }

        let result = await grpcServer.startBackup(device._id.toHexString(), true);
        if (result.error) {
          logger.error(`Error scheduling backup for device ${device._id.toHexString()} : ${result.error.message}`);
          continue;
        }
        logger.info(`Backup scheduled for device ${device._id.toHexString()}`);
      } catch (error) {
        logger.error(`Error scheduling backup for device ${device._id.toHexString()}`, error);
      }
    }
  }
}

module.exports = {
  BackupScheduler
};