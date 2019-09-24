const MongoDb = require("mongodb");
const bcrypt = require("bcryptjs");
const logger = require("../utils/logger");
const { Role, AccessRight } = require("./auth-roles");
const delay = require("../utils/helpers").delay;
const MongoClient = MongoDb.MongoClient;

class Db {
  constructor() {
    this.defaultOrgId = null;
    this._mongoClient = null;
    this._db = null;
    this._dbName = null;
  }

  get db() {
    return this._db;
  }

  get mongoClient() {
    return this._mongoClient;
  }

  configure(url, dbName, options) {
    options = options || { useNewUrlParser: true };
    this._mongoClient = new MongoClient(url, options);
    this._dbName = dbName;
  }

  collection(collection) {
    return this._db.collection(collection);
  }

  async connect() {
    await this._mongoClient.connect();
    this._db = this._mongoClient.db(this._dbName);
  }

  async truncate() {
    let collections = await this._db.listCollections().toArray();

    for (let collection of collections) {
      await this.collection(collection.name).drop();
    }
  }

  close(force) {
    this._mongoClient.close(force);
  }

  async setupDefaultCollections() {
    // Ensure default org exists
    let orgs = this._db.collection("orgs");
    let defaultOrg = await orgs.findOne({ name: "Global" });
    if (!defaultOrg) {
      logger.info("Creating default org");
      defaultOrg = {
        name: "Global"
      };
      await orgs.insertOne(defaultOrg);
    } else {
      logger.info("Default org exists", defaultOrg);
    }
    this.defaultOrgId = defaultOrg._id;

    // Ensure backupSchedule exists on the org
    await orgs.updateMany({ backupSettings: null }, {
      $set: {
        backupSettings: {
          period: "none",
          count: 1,
          time: 0,
          nextBackupTime: new Date(Date.UTC(0, 0, 0, 0, 0, 0))
        }
      }
    });

    // Ensure backupSchedule exists on the device
    let devices = this._db.collection("devices");
    await devices.updateMany({ backupSettings: null }, {
      $set: {
        backupSettings: {
          period: "none",
          count: 1,
          time: 0,
          nextBackupTime: new Date(Date.UTC(0, 0, 0, 0, 0, 0))
        }
      }
    });

    let users = this._db.collection("users");
    // Ensure default super user exists
    let defaultUser = await users.findOne({ email: "wcm@wanos.co" });
    if (!defaultUser) {
      logger.info("Creating default user");
      let hash = await bcrypt.hash("wanos", 10);
      defaultUser = {
        email: "wcm@wanos.co",
        hash: hash,
        firstname: "Wanos",
        surname: "",
        role: Role.SUPER,
        accessRight: AccessRight.WRITE,
        orgs: []
      };
      await users.insertOne(defaultUser);
    } else {
      logger.info("Default user exists", defaultUser);
    }

    // Ensure users email field has a unique index set.
    let indexExists;
    try {
      indexExists = await users.indexExists("email_unique");
    } catch (e) {
      logger.error(e);
      indexExists = e;
    }

    if (!indexExists) {
      await users.createIndex({ "email": 1 }, { name: "email_unique", unique: true });
    }

    return {
      defaultOrgId: defaultOrg._id
    };
  }

  async initialize(reconnectDelay) {
    try {
      await this.connect();
      let defaults = await this.setupDefaultCollections();
      logger.info("Connected successfully to DB");
      return defaults;
    } catch (err) {
      logger.error(`Unable to connect to MongoDB, retrying in ${reconnectDelay / 1000} seconds...`, err);
      this.close(true);
      await delay(reconnectDelay);
      return await this.initialize(reconnectDelay);
    }
  }
}

const instance = new Db();

//module.exports = instance;
module.exports.Db = function(url, dbName, options) {
  instance.configure(url, dbName, options);
  return instance;
};

//module.exports.db = instance.db;
module.exports.db = instance;