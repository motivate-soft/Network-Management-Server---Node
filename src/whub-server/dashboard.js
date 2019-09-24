const messages = require("./grpc/dashboard_pb");
const { setupRpcCall, setupRpcMethodPromise } = require("./rpc-helpers");

function rpcGetDashboardData(call) {
  setupRpcCall(call, "rpcGetDashboardData");
}

function getDashboardData(id, peerOutput) {
  const getRequest = () => {
    let request = new messages.DashboardDataRequest();
    if (peerOutput && peerOutput > 0) {
      request.setHasPeerOutput(true);
      request.setPeerOutput(peerOutput);
    } else {
      request.setHasPeerOutput(false);
    }
    return request;
  };
  const formatData = (data) => {
    return data.toObject();
  };
  return setupRpcMethodPromise(id, "rpcGetDashboardData", getRequest, formatData);
}

function rpcGetDashboardTopPorts(call) {
  setupRpcCall(call, "rpcGetDashboardTopPorts");
}

function getDashboardTopPorts(id, timeSpanSeconds, topN, peerOutput) {
  const getRequest = () => {
    let request = new messages.DashboardTopPortsRequest();
    request.setTimeSpanSeconds(timeSpanSeconds);
    request.setTopN(topN);
    if (peerOutput && peerOutput > 0) {
      request.setHasPeerOutput(true);
      request.setPeerOutput(peerOutput);
    } else {
      request.setHasPeerOutput(false);
    }
    return request;
  };
  const formatData = (data) => {
    return data.toObject();
  };
  return setupRpcMethodPromise(id, "rpcGetDashboardTopPorts", getRequest, formatData);
}

module.exports = {
  rpcGetDashboardData,
  getDashboardData,
  rpcGetDashboardTopPorts,
  getDashboardTopPorts
};