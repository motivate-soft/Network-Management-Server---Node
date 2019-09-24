const fs = require("fs");
const { GridFSBucket } = require("mongodb");
const db = require("./db").db;
const { toObjectId } = require("../utils/helpers");

const FileSort = {
  UPLOAD_DATE_ASCENDING: 1,
  UPLOAD_DATE_DESCENDING: -1
};

const getAllDeviceBackupFiles = (deviceId, sort = FileSort.UPLOAD_DATE_ASCENDING) => {
  let id = toObjectId(deviceId);
  return db.collection("deviceBackup.files")
    .find({ "metadata.deviceId": id })
    .sort({ uploadDate: sort })
    .project({ chunkSize: 0 })
    .toArray();
};

const getAllOrgBackupFiles = async (orgId, sort = FileSort.UPLOAD_DATE_ASCENDING) => {
  let id = toObjectId(orgId);
  let deviceData = await db.collection("devices")
    .find({ orgId: id })
    .project({ _id: 1, hostname: 1 })
    .toArray();

  let deviceIds = deviceData.map(x => x._id);

  let fileData = await db.collection("deviceBackup.files")
    .find({ "metadata.deviceId": { $in: deviceIds } })
    .sort({ uploadDate: sort })
    .project({ chunkSize: 0 })
    .toArray();

  return fileData.map(x => {
    let { metadata, ...backupData } = x;
    backupData.deviceId = metadata.deviceId;
    backupData.version = metadata.version;
    let device = deviceData.find(y => y._id.toHexString() === backupData.deviceId.toHexString());
    backupData.hostname = device.hostname || "";
    return backupData;
  });

};

const deleteDeviceBackupFile = (fileId) => {
  let id = toObjectId(fileId);
  let bucket = new GridFSBucket(db.db, { bucketName: "deviceBackup" });
  return bucket.delete(id);
};

const deleteDeviceBackupFilesInArray = async (fileIdArray) => {
  let bucket = new GridFSBucket(db.db, { bucketName: "deviceBackup" });
  for (let id of fileIdArray) {
    await bucket.delete(id);
  }
};

const getDeviceBackupDownloadStream = (fileId) => {
  let id = toObjectId(fileId);
  let bucket = new GridFSBucket(db.db, { bucketName: "deviceBackup" });
  return bucket.openDownloadStream(id);
};

const getDeviceBackupFile = (deviceId, fileId) => {
  let devId = toObjectId(deviceId);
  let id = toObjectId(fileId);
  return db.collection("deviceBackup.files")
    .findOne({ _id: id, "metadata.deviceId": devId });
};

const saveDeviceBackupFile = (deviceId, backupFile, filename, wanosVersion) => {
  return new Promise((resolve, reject) => {
    try {
      let id = toObjectId(deviceId);
      let bucket = new GridFSBucket(db.db, { bucketName: "deviceBackup" });
      let uploadStream = bucket.openUploadStream(filename, {
        metadata: {
          deviceId: id,
          version: wanosVersion
        }
      });
      fs.createReadStream(backupFile)
        .pipe(uploadStream)
        .on("error", (error) => {
          return reject(error);
        })
        .on("finish", function() {
          return resolve(uploadStream.id);
        });
    } catch (err) {
      return reject(err);
    }
  });
};

module.exports = {
  FileSort,
  getAllDeviceBackupFiles,
  getAllOrgBackupFiles,
  getDeviceBackupDownloadStream,
  getDeviceBackupFile,
  saveDeviceBackupFile,
  deleteDeviceBackupFile,
  deleteDeviceBackupFilesInArray
};