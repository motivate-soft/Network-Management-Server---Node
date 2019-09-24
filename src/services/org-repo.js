/* eslint-disable indent */
const db = require("./db").db;
const { toObjectId } = require("../utils/helpers");
const { ModelSchema } = require("./validation");
const logger = require("../utils/logger");
const { BackupSchedulePeriod, getNextBackupTime } = require("./backup-settings");

const OrgSchema = {
  getOrgSchema: () => {
    return new ModelSchema({
      name: ModelSchema.string().required().max(128),
      "contact.firstname": ModelSchema.string().required().max(128),
      "contact.surname": ModelSchema.string().required().max(128),
      "contact.email": ModelSchema.string().required().email().max(128),
      "contact.phone": ModelSchema.string().max(128),
      "address.line1": ModelSchema.string().max(128),
      "address.line2": ModelSchema.string().max(128),
      "address.line3": ModelSchema.string().max(128),
      "address.city": ModelSchema.string().max(128),
      "address.country": ModelSchema.string().max(128),
    });
  },
  getOrgBackupSettingsSchema: () => {
    return new ModelSchema({
      period: ModelSchema.string().required().enum([BackupSchedulePeriod.NONE, BackupSchedulePeriod.DAY, BackupSchedulePeriod.WEEK, BackupSchedulePeriod.MONTH, BackupSchedulePeriod.HOUR]),
      count: ModelSchema.number().min(1),
      time: ModelSchema.number().min(0).max(23)
    });
  }
};

const getDefaultOrgId = () => {
  return db.defaultOrgId;
};

// const getAll = () => {
//   return db.collection("orgs")
//     .find({})
//     .toArray();
// };

// const getAllInIdArray = (orgIds = []) => {
//   return db.collection("orgs")
//     .find({ _id: { $in: orgIds } })
//     .toArray();
// };

const getAll = () => {
  return db.collection("orgs")
    .aggregate([{
      $lookup: {
        from: "devices",
        let: { org_id: "$_id" },
        pipeline: [{
            $match: {
              $expr: { $eq: ["$orgId", "$$org_id"] }
            }
          },
          { $project: { _id: 1 } }
        ],
        as: "devices"
      }
    }, {
      $lookup: {
        from: "users",
        let: { org_id: "$_id" },
        pipeline: [{
            $match: {
              $expr: {
                $or: [
                  { $in: ["$$org_id", "$orgs"] },
                  { $eq: ["$orgs", []] }
                ]
              }
            }
          },
          { $project: { _id: 1 } }
        ],
        as: "users"
      }
    }])
    .toArray();
};

const getAllInIdArray = (orgIds = []) => {
  return db.collection("orgs")
    .aggregate([{
      $match: { _id: { $in: orgIds } }
    }, {
      $lookup: {
        from: "devices",
        let: { org_id: "$_id" },
        pipeline: [{
            $match: {
              $expr: { $eq: ["$orgId", "$$org_id"] }
            }
          },
          { $project: { _id: 1 } }
        ],
        as: "devices"
      }
    }, {
      $lookup: {
        from: "users",
        let: { org_id: "$_id" },
        pipeline: [{
            $match: {
              $expr: {
                $or: [
                  { $in: ["$$org_id", "$orgs"] },
                  { $eq: ["$orgs", []] }
                ]
              }
            }
          },
          { $project: { _id: 1 } }
        ],
        as: "users"
      }
    }])
    .toArray();
};

const getById = (orgId) => {
  let id = toObjectId(orgId);
  return db.collection("orgs")
    .findOne({ _id: id });
};

const countAllInIdArray = (orgIds = []) => {
  return db.collection("orgs")
    .countDocuments({ _id: { $in: orgIds } });
};

const add = (org) => {
  return db.collection("orgs")
    .insertOne(org);
};

const updateById = (orgId, updatedOrg) => {
  let id = toObjectId(orgId);
  let contact = updatedOrg.contact || {};
  let address = updatedOrg.address || {};
  return db.collection("orgs")
    .updateOne({
      _id: id
    }, {
      $set: {
        name: updatedOrg.name,
        "contact.firstname": contact.firstname,
        "contact.surname": contact.surname,
        "contact.email": contact.email,
        "contact.phone": contact.phone,
        "address.line1": address.line1,
        "address.line2": address.line2,
        "address.line3": address.line3,
        "address.city": address.city,
        "address.country": address.country
      }
    });
};

const removeById = (orgId) => {
  let id = toObjectId(orgId);
  return db.collection("orgs")
    .deleteOne({ _id: id });
};

const getBackupSettings = (orgId) => {
  let id = toObjectId(orgId);
  return db.collection("orgs")
    .findOne({ _id: id }, { projection: { backupSettings: 1 } });
};

const updateBackupSettings = async (orgId, backupSettings) => {
  // We need to calculate the new nextBackupTime for the org and
  // sync the new backup settings to the devices of the org.
  let id = toObjectId(orgId);
  let nextBackupTime = getNextBackupTime(backupSettings, new Date());
  try {
    // Update the organization backup settings
    let newBackupSettings = {
      period: backupSettings.period,
      count: backupSettings.count,
      time: backupSettings.time,
      nextBackupTime: nextBackupTime
    };
    await db.collection("orgs")
      .updateOne({
        _id: id
      }, {
        $set: {
          backupSettings: newBackupSettings
        }
      });
    // Update the org devices backup settings
    await db.collection("devices")
      .updateMany({
        orgId: id
      }, {
        $set: {
          backupSettings: newBackupSettings
        }
      });
  } catch (error) {
    logger.error("Error setting org backup settings.", error);
    throw error;
  }
};

const updateNextBackupTimeForOrgOnly = async (orgId, backupSettings, now) => {
  let id = toObjectId(orgId);
  let nextBackupTime = getNextBackupTime(backupSettings, now);
  logger.info(`Setting next backup time for org ${id.toHexString()} to ${nextBackupTime}.`);
  return db.collection("orgs")
    .updateOne({
      _id: id
    }, {
      $set: {
        "backupSettings.nextBackupTime": nextBackupTime
      }
    });
};

// const getAllThatRequireBackup = (backupTime) => {
//   return db.collection("orgs")
//     .aggregate([{
//       $match: {
//         "backupSchedule.period": { $ne: BackupSchedulePeriod.NONE },
//         "backupSchedule.nextBackupTime": { $lte: backupTime }
//       }
//     }, {
//       $lookup: {
//         from: "devices",
//         localField: "_id",
//         foreignField: "orgId",
//         as: "devices"
//       }
//     }, {
//       $project: { name: 1, "devices._id": 1, "devices.hostname": 1, "devices.online": 1 }
//     }, {
//       $match: {
//         "devices.online": true,
//         devices: { $ne: [] }
//       }
//     }])
//     .toArray();
// };

const getAllThatRequireBackup = (backupTime) => {
  return db.collection("orgs")
    .find({
      "backupSettings.period": { $ne: BackupSchedulePeriod.NONE },
      "backupSettings.nextBackupTime": { $lte: backupTime }
    })
    .project({
      backupSettings: 1
    })
    .toArray();
};

module.exports = {
  BackupSchedulePeriod,
  OrgSchema,
  getDefaultOrgId,
  getAll,
  getAllInIdArray,
  getById,
  countAllInIdArray,
  add,
  updateById,
  removeById,
  getBackupSettings,
  updateBackupSettings,
  getAllThatRequireBackup,
  updateNextBackupTimeForOrgOnly
};