const messages = require("./grpc/diagnostic_pb");
const { setupRpcCall, setupRpcMethodPromise } = require("./rpc-helpers");

const getLogLevel = (logLevelString) => {
  switch (logLevelString.toLowerCase()) {
    case "debug":
      return messages.DiagnosticLogLevelEnum.DEBUG;
    case "info":
      return messages.DiagnosticLogLevelEnum.INFO;
    case "warn":
      return messages.DiagnosticLogLevelEnum.WARN;
    case "error":
      return messages.DiagnosticLogLevelEnum.ERROR;
    default:
      return messages.DiagnosticLogLevelEnum.INFO;
  }
};

const rpcGetDiagnosticLog = (call) => {
  setupRpcCall(call, "rpcGetDiagnosticLog");
};

const getDiagnosticLog = (id, logLevel) => {
  const getRequest = () => {
    let request = new messages.DiagnosticLogRequest();
    request.setLevel(getLogLevel(logLevel));
    return request;
  };
  const formatData = (data) => {
    return data.hasError() ? data.toObject() : data.toObject().logList;
  };
  return setupRpcMethodPromise(id, "rpcGetDiagnosticLog", getRequest, formatData);
};

const rpcGetDiagnosticHealth = (call) => {
  setupRpcCall(call, "rpcGetDiagnosticHealth");
};

const getDiagnosticHealth = (id) => {
  const getRequest = () => {
    let request = new messages.DiagnosticHealthRequest();
    return request;
  };
  const formatData = (data) => {
    return data.hasError() ? data.toObject() : data.toObject().itemList;
  };
  return setupRpcMethodPromise(id, "rpcGetDiagnosticHealth", getRequest, formatData);
};

const rpcGetDiagnosticBenchmark = (call) => {
  setupRpcCall(call, "rpcGetDiagnosticBenchmark");
};

const getDiagnosticBenchmark = (id) => {
  const getRequest = () => {
    let request = new messages.DiagnosticBenchmarkRequest();
    return request;
  };
  const formatData = (data) => {
    return data.hasError() ? data.toObject() : data.toObject().report;
  };
  return setupRpcMethodPromise(id, "rpcGetDiagnosticBenchmark", getRequest, formatData);
};

const rpcScheduleDiagnosticBenchmark = (call) => {
  setupRpcCall(call, "rpcScheduleDiagnosticBenchmark");
};

const scheduleDiagnosticBenchmark = (id) => {
  const getRequest = () => {
    let request = new messages.DiagnosticBenchmarkRequest();
    return request;
  };
  const formatData = (data) => {
    return data.hasError() ? data.toObject() : data.toObject().report;
  };
  return setupRpcMethodPromise(id, "rpcScheduleDiagnosticBenchmark", getRequest, formatData);
};

const rpcGetDiagnosticNetstat = (call) => {
  setupRpcCall(call, "rpcGetDiagnosticNetstat");
};

const getDiagnosticNetstat = (id) => {
  const getRequest = () => {
    let request = new messages.DiagnosticNetstatRequest();
    return request;
  };
  const formatData = (data) => {
    return data.hasError() ? data.toObject() : data.toObject().report;
  };
  return setupRpcMethodPromise(id, "rpcGetDiagnosticNetstat", getRequest, formatData);
};

const rpcGetDiagnosticPing = (call) => {
  setupRpcCall(call, "rpcGetDiagnosticPing");
};

const getDiagnosticPing = (id, hostIp, ipv6, count) => {
  const getRequest = () => {
    let request = new messages.DiagnosticPingRequest();
    let options = new messages.DiagnosticPingOptions();
    options.setHostIp(hostIp);
    options.setIpv6(ipv6);
    options.setCount(count);
    request.setPingOptions(options);
    return request;
  };
  const formatData = (data) => {
    return data.hasError() ? data.toObject() : data.toObject().lineList;
  };
  return setupRpcMethodPromise(id, "rpcGetDiagnosticPing", getRequest, formatData);
};

const rpcGetDiagnosticTraceroute = (call) => {
  setupRpcCall(call, "rpcGetDiagnosticTraceroute");
};

const getDiagnosticTraceroute = (id, hostIp, hops, ipv6, icmp, lookup) => {
  const getRequest = () => {
    let request = new messages.DiagnosticTracerouteRequest();
    let options = new messages.DiagnosticTracerouteOptions();
    options.setHostIp(hostIp);
    options.setHops(hops);
    options.setIpv6(ipv6);
    options.setIcmp(icmp);
    options.setLookup(lookup);
    request.setTracerouteOptions(options);
    return request;
  };
  const formatData = (data) => {
    return data.hasError() ? data.toObject() : data.toObject().lineList;
  };
  return setupRpcMethodPromise(id, "rpcGetDiagnosticTraceroute", getRequest, formatData);
};

module.exports = {
  rpcGetDiagnosticLog,
  getDiagnosticLog,
  rpcGetDiagnosticHealth,
  getDiagnosticHealth,
  rpcGetDiagnosticBenchmark,
  getDiagnosticBenchmark,
  rpcScheduleDiagnosticBenchmark,
  scheduleDiagnosticBenchmark,
  rpcGetDiagnosticNetstat,
  getDiagnosticNetstat,
  rpcGetDiagnosticPing,
  getDiagnosticPing,
  rpcGetDiagnosticTraceroute,
  getDiagnosticTraceroute
};