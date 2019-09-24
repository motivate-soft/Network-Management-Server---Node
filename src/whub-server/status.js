const messages = require("./grpc/status_pb");
const { setupRpcCall, setupRpcMethodPromise } = require("./rpc-helpers");
const { onlineDevices } = require("./rpc-helpers");
const logger = require("../utils/logger");
const deviceRepo = require("../services/device-repo");

const handleStatusUpdate = async (call, data) => {
  let metadata = call.metadata.getMap();
  let deviceId = metadata.id;
  let device = onlineDevices.get(deviceId);
  if (!device) {
    logger.warn(`rpcGetStatusUpdate data received while device not online: ${deviceId}`);
    return;
  }
  let shouldUpdate = false;
  let reconfigure = data.getAlert().getReconfigure();
  if (device.alert === undefined) {
    device.alert = {
      reconfigure: false
    };
    shouldUpdate = true;
  }
  if (device.alert.reconfigure === undefined) {
    device.alert.reconfigure = false;
    shouldUpdate = true;
  }
  if (device.alert.reconfigure !== reconfigure) {
    device.alert.reconfigure = reconfigure;
    shouldUpdate = true;
  }
  if (shouldUpdate) {
    await deviceRepo.setReconfigure(deviceId, reconfigure);
  }

  let lastErrorAt = data.getAlert().getLastErrorAt();
  if (lastErrorAt > 0) {
    let hasNewError = false;
    let device = await deviceRepo.getDevice(deviceId);
    if (!(device.logReviewedAt instanceof Date) || isNaN(device.logReviewedAt.getTime())) {
      hasNewError = true
    } else if (device.logReviewedAt.getTime() < lastErrorAt) {
      hasNewError = true;
    }

    if (hasNewError != (device.alert || {}).error) {
      deviceRepo.setErrorAlert(deviceId, hasNewError);
    }
  }
};

const rpcGetStatusUpdate = (call) => {
  setupRpcCall(call, "rpcGetStatusUpdate");
  call.on("data", async (data) => {
    call.pause();
    await handleStatusUpdate(call, data);
    call.resume();
  });
};

const getStatusUpdate = (id) => {
  const getRequest = () => {
    let request = new messages.StatusUpdateRequest();
    return request;
  };
  const formatData = (data) => {
    if (data.hasError()) {
      return data.toObject();
    } else {
      return data.toObject().status;
    }
  };
  return setupRpcMethodPromise(id, "rpcGetStatusUpdate", getRequest, formatData);
};

module.exports = {
  rpcGetStatusUpdate,
  getStatusUpdate
};