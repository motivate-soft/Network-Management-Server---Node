const UInt32Counter = require("../utils/uint32").UInt32Counter;
const logger = require("../utils/logger");
const { ErrorCode, ApiError } = require("../services/errors");

const onlineDevices = new Map();
const requestId = new UInt32Counter(0);

const setupRpcCall = (call, callName) => {
  let metadata = call.metadata.getMap();
  let device = onlineDevices.get(metadata.id);

  // The remote device should already be in our online devices map,
  // if not log error and return.
  if (!device) {
    logger.warn(`${callName} call received while device not online: ${metadata.id}`);
    return;
  }

  device[callName] = call;

  call.on("end", () => {
    call.end();
  });

  call.on("error", (error) => {
    logger.info(`${callName} ERROR:`, error);
  });
};

const setupRpcMethodPromise = (id, callName, getRequest, formatData) => {
  return new Promise((resolve, reject) => {
    let device = onlineDevices.get(id);
    if (!device) {
      return reject(new ApiError(ErrorCode.DEVICE_OFFLINE, "Device not online."));
    }
    if (!device[callName]) {
      return reject(new Error(`Device ${callName} not set.`));
    }

    let call = device[callName];
    let request = getRequest();
    // We use the requestId to distinguish between seperate requests as
    // multiple users could call method at the same time.
    request.setRequestId(requestId.increment());

    let errorHandler = (err) => {
      return reject(err);
    };
    let dataHandler = (data) => {
      if (data.getRequestId() !== request.getRequestId()) {
        return;
      }
      call.removeListener("error", errorHandler);
      call.removeListener("data", dataHandler);
      let result = formatData(data);
      if (result && result.requestId) {
        delete result.requestId;
      }
      return resolve(result);
    };

    call.on("error", errorHandler);
    call.on("data", dataHandler);

    call.write(request);
  });
};

module.exports = {
  onlineDevices,
  requestId,
  setupRpcCall,
  setupRpcMethodPromise
};
