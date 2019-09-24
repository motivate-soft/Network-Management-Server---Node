const db = require("./db").db;
const { toObjectId } = require("../utils/helpers");
const { ModelSchema } = require("./validation");
const { Role, AccessRight } = require("./auth-roles");
const bcrypt = require("bcryptjs");

const UserSchema = {
  getUserSchema: () => {
    return new ModelSchema({
      email: ModelSchema.string().required().email().max(128),
      firstname: ModelSchema.string().required().max(128),
      surname: ModelSchema.string().required().max(128),
      role: ModelSchema.string().required().enum([Role.SUPER, Role.ORG]),
      accessRight: ModelSchema.string().required().enum([AccessRight.WRITE, AccessRight.READ]),
      settings: {
        theme: ModelSchema.string().enum(['darkTheme', 'lightTheme'])
      }
      //orgs: []
    });
  },

  getUserWithPasswordSchema: () => {
    let schema = UserSchema.getUserSchema();
    schema.schemaMap["password"] = ModelSchema.string().required().max(128);
    schema.schemaMap["confirmPassword"] = ModelSchema.string().required().max(128).compare("password");
    return schema;
  }
};

const getAll = () => {
  return db.collection("users")
    .find({}, { projection: { hash: false } })
    .toArray();
};

const getAllInOrgIdArray = (orgIds) => {
  return db.collection("users")
    .find({
      orgs: { $elemMatch: { $in: orgIds } }
    }, {
      projection: { hash: false }
    })
    .toArray();
};

const getByEmail = (email) => {
  return db.collection("users")
    .findOne({ email: email });
};

const getById = (userId) => {
  let id = toObjectId(userId);
  return db.collection("users")
    .findOne({ _id: id });
};

const comparePassword = (candidatePassword, hash, callback) => {
  bcrypt.compare(candidatePassword, hash, function(err, isMatch) {
    if(err) throw err;
    callback(null, isMatch);
  });
}

const setPasswordHash = (userId, hash) => {
  let id = toObjectId(userId);
  return db.collection("users")
    .updateOne({ _id: id }, { $set: { hash: hash } });
};

const add = (user) => {
  return db.collection("users")
    .insertOne(user);
};

const removeById = (userId) => {
  let id = toObjectId(userId);
  return db.collection("users")
    .deleteOne({ _id: id });
};

const updateById = (userId, updatedUser) => {
  let id = toObjectId(userId);
  return db.collection("users")
    .updateOne({
      _id: id
    }, {
      $set: {
        email: updatedUser.email,
        firstname: updatedUser.firstname,
        surname: updatedUser.surname,
        role: updatedUser.role,
        accessRight: updatedUser.accessRight,
        orgs: updatedUser.orgs
      }
    });
};

const updateUserSettings = (userId, settings) => {
  const id = toObjectId(userId);
  return db.collection("users")
    .updateOne({
      _id: id
    }, {
      $set: { settings: settings }
    });
};

const removeOrgIdFromAll = (orgId) => {
  let id = toObjectId(orgId);
  return db.collection("users")
    .updateMany({}, { $pull: { orgs: id } });
};

module.exports = {
  UserSchema,
  getAll,
  getAllInOrgIdArray,
  getByEmail,
  getById,
  comparePassword,
  setPasswordHash,
  add,
  removeById,
  updateById,
  removeOrgIdFromAll,
  updateUserSettings
};