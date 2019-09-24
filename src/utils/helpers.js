const fs = require("fs");
const crypto = require("crypto");
const ObjectId = require("mongodb").ObjectId;

const isString = (value) => { return typeof value === "string" || value instanceof String; };
const isNumberType = (value) => { return typeof value === "number" || value instanceof Number; };
const delay = (ms) => { return new Promise(resolve => setTimeout(resolve, ms)); };
const isNumber = (n) => { return !isNaN(parseFloat(n)) && isFinite(n); };
const toObjectIdArray = (arr) => { return arr.map(id => { return ObjectId(id); }); };
const toObjectId = (id) => { return isString(id) ? new ObjectId(id) : id; };

const getFileHash = (localFile, hashAlgo) => {
  return new Promise((resolve, reject) => {
    try {
      let cryptoStream = crypto.createHash(hashAlgo)
        .setEncoding("hex");
      fs.createReadStream(localFile)
        .on("error", reject)
        .pipe(cryptoStream)
        .once("finish", () => {
          let hash = cryptoStream.read();
          resolve(hash);
        });
    } catch (err) {
      return reject(err);
    }
  });
};

module.exports = {
  isString,
  isNumberType,
  delay,
  isNumber,
  toObjectIdArray,
  toObjectId,
  getFileHash
};