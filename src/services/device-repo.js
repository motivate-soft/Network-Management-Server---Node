const db = require("../services/db").db;
const toObjectId = require("../utils/helpers").toObjectId;
const { ModelSchema } = require("./validation");
const { BackupSchedulePeriod } = require("./backup-settings");
const orgRepo = require("./org-repo");


const repo = {

  DeviceSchema: {
    getDeviceUpdateSchema: () => {
      return new ModelSchema({
        "orgId": ModelSchema.string().required(),
        "loc.lat": ModelSchema.number().required().min(-90).max(90),
        "loc.lng": ModelSchema.number().required().min(-180).max(180),
        "contact.firstname": ModelSchema.string().max(128),
        "contact.surname": ModelSchema.string().max(128),
        "contact.email": ModelSchema.string().email().max(128),
        "contact.phone": ModelSchema.string().max(128),
        "address.line1": ModelSchema.string().max(128),
        "address.line2": ModelSchema.string().max(128),
        "address.line3": ModelSchema.string().max(128),
        "address.city": ModelSchema.string().max(128),
        "address.country": ModelSchema.string().max(128),
      });
    }
  },

  getDevicesForOrg(orgId) {
    let id = toObjectId(orgId);
    return db.collection("devices")
      .find({ orgId: id })
      .project({ stats: 0 })
      .toArray();
  },

  getDevicesStatsForOrg(orgId) {
    let id = toObjectId(orgId);
    return db.collection("devices")
      .find({ orgId: id })
      .project({ _id: 1, hostname: 1, ip: 1, online: 1, stats: 1, wanosLicense: 1, alert: 1})
      .toArray();
  },

  updateDeviceStats(deviceId, deviceStats) {
    let id = toObjectId(deviceId);
    return db.collection("devices")
      .updateOne({ _id: id }, { $set: { stats: deviceStats } });
  },

  updateDevicePeers(deviceId, peers) {
    let id = toObjectId(deviceId);
    return db.collection("devices")
      .updateOne({ _id: id }, { $set: { peersList: peers } });
  },

  getDevice(deviceId) {
    let id = toObjectId(deviceId);
    return db.collection("devices")
      .findOne({ _id: id });
  },

  getDeviceByMac(mac) {
    return db.collection("devices")
      .findOne({ mac: mac });
  },

  updateDevice(device) {
    return db.collection("devices")
      .findOneAndUpdate({ _id: device._id }, {
        $set: device
      }, {
        returnOriginal: false
      });
  },

  setDeviceOnline(deviceId) {
    let id = toObjectId(deviceId);
    return db.collection("devices")
      .updateOne({ _id: id }, {
        $set: { online: true }
      });
  },

  setDeviceOffline(deviceId) {
    let id = toObjectId(deviceId);
    return db.collection("devices")
      .updateOne({ _id: id }, {
        $set: { online: false }
      });
  },

  setReconfigure(deviceId, reconfigure) {
    let id = toObjectId(deviceId);
    return db.collection("devices")
      .updateOne({ _id: id }, {
        $set: { "alert.reconfigure": reconfigure }
      });
  },

  setErrorAlert(deviceId, bErrorStatus) {
    let id = toObjectId(deviceId);
    return db.collection("devices")
      .updateOne({ _id: id }, {
        $set: { "alert.error": bErrorStatus }
      });
  },

  setAllDevicesOffline() {
    return db.collection("devices").updateMany({}, { $set: { online: false } });
  },

  async insertDevice(device) {
    if (!device.backupSettings) {
      // Set new device's default backup settings
      device.backupSettings = await orgRepo.getBackupSettings(device.orgId);
    }
    return db.collection("devices")
      .insertOne(device);
  },

  getAllInOrgIdArray(orgIds) {
    return db.collection("devices")
      .find({
        orgId: { $in: orgIds }
      })
      .toArray();
  },

  getAll() {
    return db.collection("devices")
      .find({})
      .toArray();
  },

  removeById(deviceId) {
    let id = toObjectId(deviceId);
    return db.collection("devices")
      .deleteOne({ _id: id });
  },

  updateById(deviceId, updatedDevice) {
    let id = toObjectId(deviceId);
    let orgId = toObjectId(updatedDevice.orgId);
    let contact = updatedDevice.contact || {};
    let address = updatedDevice.address || {};
    
    const backupSettings = updatedDevice.backupSettings ?
      ['period', 'count', 'time', 'nextBackupTime'].reduce((acc, key) => {
        acc[`backupSettings.${key}`] = updatedDevice.backupSettings[key];
        return acc;
      }, {}) : {};
    
    return db.collection("devices")
      .updateOne({
        _id: id
      }, {
        $set: {
          "loc.lat": updatedDevice.loc.lat,
          "loc.lng": updatedDevice.loc.lng,
          "contact.firstname": contact.firstname,
          "contact.surname": contact.surname,
          "contact.email": contact.email,
          "contact.phone": contact.phone,
          "address.line1": address.line1,
          "address.line2": address.line2,
          "address.line3": address.line3,
          "address.city": address.city,
          "address.country": address.country,
          orgId: orgId,
          ...backupSettings
        }
      });
  },

  getDeviceOrgId(deviceId) {
    let id = toObjectId(deviceId);
    return db.collection("devices")
      .findOne({ _id: id }, { projection: { orgId: 1 } });
  },

  getAlert(deviceId) {
    let id = toObjectId(deviceId);
    return db.collection("devices")
      .findOne({ _id: id }, { projection: { alert: 1 } });
  },

  getAllThatRequireBackup(backupTime) {
    return db.collection("devices")
      .find({
        "backupSettings.period": { $ne: BackupSchedulePeriod.NONE },
        "backupSettings.nextBackupTime": { $lte: backupTime },
        online: true
      })
      .project({
        _id: 1
      })
      .toArray();
  },

  setNextBackupTime(deviceId, nextBackupTime) {
    let id = toObjectId(deviceId);
    return db.collection("devices")
      .updateOne({
        _id: id
      }, {
        $set: {
          "backupSettings.nextBackupTime": nextBackupTime
        }
      });
  },

  dismissErrorsBefore(deviceId, logReviewedAt) {
    let id = toObjectId(deviceId);
    return db.collection("devices")
      .updateOne({
        _id: id
      }, {
        $set: {
          "logReviewedAt": logReviewedAt
        }
      });
  }

};

module.exports = repo;
