var fs = require("fs");
const path = require("path");
const util = require("util");
const exec = util.promisify(require("child_process").exec);
const grpc = require("grpc");
const messages = require("./grpc/patcher_pb");
const fileTransferMessages = require("./grpc/file_transfer_pb");
const errorMessages = require("./grpc/error_pb");
const config = require("../config/config");
const { ErrorCode } = require("../services/errors");
const { getFileHash } = require("../utils/helpers");
const logger = require("../utils/logger");

const AgentFileUrlBase = "wcm-agent-packages/";

class FileHasher {
  constructor(hashAlgo) {
    this._hashAlgo = hashAlgo;
    this._map = new Map();
  }

  get hashAlgo() {
    return this._hashAlgo;
  }

  async getHash(file) {
    let hash = this._map.get(file);
    if (hash) {
      return hash;
    }
    hash = await getFileHash(file, this._hashAlgo);
    this._map.set(file, hash);
    return hash;
  }
}

class Patcher {
  constructor() {
    this._fileHasher = new FileHasher(config.hashAlgo);
  }

  async rpcDownloadFile(call) {
    let metadata = call.metadata.getMap();
    let deviceId = metadata.id;
    let request = call.request.toObject();
    let localFile = null;

    logger.info("rpcDownloadFile", request);

    if (request.fileUrl.startsWith(AgentFileUrlBase)) {
      localFile = path.join(config.agentPackagePath, request.fileUrl.replace(AgentFileUrlBase, ""));
    }

    if (!fs.existsSync(localFile)) {
      logger.warn(`File ${request.fileUrl} not found. Request from device ${deviceId}.`);
      let errorMessage = new errorMessages.Error();
      errorMessage.setCode(ErrorCode.NOT_FOUND);
      errorMessage.setMessage(`File ${request.fileUrl} not found.`);
      let errorResponse = new fileTransferMessages.FileTransferResponse();
      errorResponse.setError(errorMessage);
      call.write(errorResponse);
      call.end();
      return;
    }

    try {

      // Send file info
      let fileStat = fs.statSync(localFile);
      let hash = await this._fileHasher.getHash(localFile);

      let fileInfo = new fileTransferMessages.FileInfo();
      fileInfo.setName(localFile);
      fileInfo.setSize(fileStat.size);
      fileInfo.setHash(hash);
      fileInfo.setHashAlgo(this._fileHasher.hashAlgo);

      let response = new fileTransferMessages.FileTransferResponse();
      response.setFileInfo(fileInfo);
      call.write(response);

      let fileStream = fs.createReadStream(localFile, { highWaterMark: 64 * 1024 });
      fileStream.on("data", (data) => {
        let chunk = new fileTransferMessages.Chunk();
        chunk.setData(data);
        let response = new fileTransferMessages.FileTransferResponse();
        response.setChunk(chunk);
        call.write(response);
      });

      fileStream.on("end", () => {
        call.end();
      });

      fileStream.on("error", (error) => {
        logger.error(`Error transferring file - Url: ${request.fileUrl}, Device: ${deviceId}`, error);
      });
    } catch (error) {
      logger.error(`Error transferring file - Url: ${request.fileUrl}, Device: ${deviceId}`, error);
    }
  }

  async rpcGetServerAgentVersion(call, callback) {
    let request = call.request.toObject();
    let metadata = call.metadata.getMap();
    let deviceId = metadata.id;

    logger.info("rpcGetServerAgentVersion", request);

    try {
      let response = new messages.ServerAgentVersionResponse();
      response.setVersion(config.agentVersion);

      if (config.agentVersion === request.version) {
        logger.info(`Device ${deviceId} is running the latest agent version ${request.version}.`);
        return callback(null, response);
      }

      let clientPackageFile = path.join(config.agentPackagePath, request.localAgentFilename);
      let serverPackageFilename = `wcm-agent.${config.agentVersion}.tar.bz2`;
      let serverPackageFile = path.join(config.agentPackagePath, serverPackageFilename);

      if (!fs.existsSync(serverPackageFile)) {
        throw new Error(`Server agent package file ${serverPackageFile} does not exist.`);
      }

      if (fs.existsSync(clientPackageFile)) {
        // Nice we have the client agent file, so we can provide a patch file.
        let patchFilename = `wcm-agent.${request.version}-${config.agentVersion}.patch`;
        let patchFile = path.join(config.agentPackagePath, patchFilename);
        logger.info(`Looking for patch file ${patchFile}`);
        if (!fs.existsSync(patchFile)) {
          logger.info(`Patch file not found ${patchFile}`);
          await this.generatePatchFile(clientPackageFile, serverPackageFile, patchFile);
        }
        response.setUpdateFileUrl(`${AgentFileUrlBase}${patchFilename}`);
        response.setUpdateType(messages.UpdateTypeEnum.PATCH);
      } else {
        response.setUpdateFileUrl(`${AgentFileUrlBase}${serverPackageFilename}`);
        response.setUpdateType(messages.UpdateTypeEnum.FULL);
      }

      let agentPackageHash = await this._fileHasher.getHash(serverPackageFile);
      response.setAgentPackageHash(agentPackageHash);
      response.setAgentPackageHashAlgo(this._fileHasher.hashAlgo);
      return callback(null, response);

    } catch (error) {
      logger.error(`Error on rpcGetServerAgentVersion - Device: ${deviceId}`, error);
      return callback({
        code: grpc.status.UNKNOWN,
        messages: `Error on rpcGetServerAgentVersion - Device: ${deviceId}. ${error.message}`
      });
    }
  }

  async generatePatchFile(oldFile, newFile, patchFile) {
    if (fs.existsSync(patchFile)) {
      fs.unlinkSync(patchFile);
    }
    logger.info(`Generating patch file ${patchFile} start.`);
    await exec(`xdelta3 -eq -s ${oldFile} ${newFile} ${patchFile}`);
    logger.info(`Generating patch file ${patchFile} done.`);
  }
}

module.exports = {
  Patcher
};