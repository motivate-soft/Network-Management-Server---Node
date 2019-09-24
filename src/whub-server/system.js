const messages = require("./grpc/system_pb");
const reportMessages = require("./grpc/report_pb");
const { setupRpcCall, setupRpcMethodPromise } = require("./rpc-helpers");

const getReportPeriod = (periodString) => {
  switch (periodString.toLowerCase()) {
    case "hour":
      return reportMessages.ReportPeriod.PERIOD_HOUR;
    case "day":
      return reportMessages.ReportPeriod.PERIOD_DAY;
    case "week":
      return reportMessages.ReportPeriod.PERIOD_WEEK;
    case "month":
      return reportMessages.ReportPeriod.PERIOD_MONTH;
    case "year":
      return reportMessages.ReportPeriod.PERIOD_YEAR;
    default:
      return reportMessages.ReportPeriod.PERIOD_HOUR;
  }
};

const rpcGetSystemMemory = (call) => {
  setupRpcCall(call, "rpcGetSystemMemory");
};

const getSystemMemory = (id, period) => {
  const getRequest = () => {
    let request = new messages.SystemMemoryRequest();
    request.setPeriod(getReportPeriod(period));
    return request;
  };
  const formatData = (data) => {
    return data.hasError() ? data.toObject() : data.toObject().report;
  };
  return setupRpcMethodPromise(id, "rpcGetSystemMemory", getRequest, formatData);
};

const rpcGetSystemLoad = (call) => {
  setupRpcCall(call, "rpcGetSystemLoad");
};

const getSystemLoad = (id, period) => {
  const getRequest = () => {
    let request = new messages.SystemLoadRequest();
    request.setPeriod(getReportPeriod(period));
    return request;
  };
  const formatData = (data) => {
    return data.hasError() ? data.toObject() : data.toObject().report;
  };
  return setupRpcMethodPromise(id, "rpcGetSystemLoad", getRequest, formatData);
};

const rpcGetSystemCpu = (call) => {
  setupRpcCall(call, "rpcGetSystemCpu");
};

const getSystemCpu = (id, period) => {
  const getRequest = () => {
    let request = new messages.SystemCpuRequest();
    request.setPeriod(getReportPeriod(period));
    return request;
  };
  const formatData = (data) => {
    return data.hasError() ? data.toObject() : data.toObject().report;
  };
  return setupRpcMethodPromise(id, "rpcGetSystemCpu", getRequest, formatData);
};

const rpcGetSystemDiskLoad = (call) => {
  setupRpcCall(call, "rpcGetSystemDiskLoad");
};

const getSystemDiskLoad = (id, period) => {
  const getRequest = () => {
    let request = new messages.SystemDiskLoadRequest();
    request.setPeriod(getReportPeriod(period));
    return request;
  };
  const formatData = (data) => {
    return data.hasError() ? data.toObject() : data.toObject().report;
  };
  return setupRpcMethodPromise(id, "rpcGetSystemDiskLoad", getRequest, formatData);
};

const rpcGetSystemDiskSpace = (call) => {
  setupRpcCall(call, "rpcGetSystemDiskSpace");
};

const getSystemDiskSpace = (id, period) => {
  const getRequest = () => {
    let request = new messages.SystemDiskSpaceRequest();
    request.setPeriod(getReportPeriod(period));
    return request;
  };
  const formatData = (data) => {
    return data.hasError() ? data.toObject() : data.toObject().report;
  };
  return setupRpcMethodPromise(id, "rpcGetSystemDiskSpace", getRequest, formatData);
};

const rpcGetSystemInfo = (call) => {
  setupRpcCall(call, "rpcGetSystemInfo");
};

const getSystemInfo = (id) => {
  const getRequest = () => {
    return new messages.SystemInfoRequest();
  };
  const formatData = (data) => {
    return data.hasError() ? data.toObject() : data.toObject().info;
  };
  return setupRpcMethodPromise(id, "rpcGetSystemInfo", getRequest, formatData);
};

const rpcGetSystemIndicators = (call) => {
  setupRpcCall(call, "rpcGetSystemIndicators");
};

const getSystemIndicators = (id) => {
  const getRequest = () => {
    return new messages.SystemIndicatorsRequest();
  };
  const formatData = (data) => {
    return data.hasError() ? data.toObject() : data.toObject().indicators;
  };
  return setupRpcMethodPromise(id, "rpcGetSystemIndicators", getRequest, formatData);
};

module.exports = {
  rpcGetSystemMemory,
  getSystemMemory,
  rpcGetSystemLoad,
  getSystemLoad,
  rpcGetSystemCpu,
  getSystemCpu,
  rpcGetSystemDiskLoad,
  getSystemDiskLoad,
  rpcGetSystemDiskSpace,
  getSystemDiskSpace,
  rpcGetSystemInfo,
  getSystemInfo,
  rpcGetSystemIndicators,
  getSystemIndicators
};