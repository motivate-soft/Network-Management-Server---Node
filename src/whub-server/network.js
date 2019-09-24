const messages = require("./grpc/network_pb");
const reportMessages = require("./grpc/report_pb");
const { setupRpcCall, setupRpcMethodPromise } = require("./rpc-helpers");
const { ValidationCode, InvalidArgumentApiError } = require("../services/errors");

const rpcGetNetworkApplications = (call) => {
  setupRpcCall(call, "rpcGetNetworkApplications");
};

const getNetworkApplications = (id) => {
  const getRequest = () => {
    return new messages.NetworkApplicationsRequest();
  };
  const formatData = (data) => {
    return data.hasError() ? data.toObject() : data.toObject().applicationList;
  };
  return setupRpcMethodPromise(id, "rpcGetNetworkApplications", getRequest, formatData);
};

const rpcGetNetworkSessions = (call) => {
  setupRpcCall(call, "rpcGetNetworkSessions");
};

const getNetworkSessions = (id, filterOptions) => {
  const getRequest = () => {
    let request = new messages.NetworkSessionsRequest();
    request.setFilter(getNetworkSessionsFilter(filterOptions));
    return request;
  };
  const formatData = (data) => {
    return data.toObject();
  };
  return setupRpcMethodPromise(id, "rpcGetNetworkSessions", getRequest, formatData);
};

const rpcGetNetworkSessionDetail = (call) => {
  setupRpcCall(call, "rpcGetNetworkSessionDetail");
};

const getNetworkSessionDetail = (id, filterOptions) => {
  const getRequest = () => {
    let request = new messages.NetworkSessionDetailRequest();
    request.setFilter(getNetworkSessionDetailFilter(filterOptions));
    return request;
  };
  const formatData = (data) => {
    return data.toObject();
  };
  return setupRpcMethodPromise(id, "rpcGetNetworkSessionDetail", getRequest, formatData);
};

const rpcGetNetworkTopApplications = (call) => {
  setupRpcCall(call, "rpcGetNetworkTopApplications");
};

const getNetworkTopApplications = (id, filterOptions) => {
  const getRequest = () => {
    let request = new messages.NetworkTopApplicationsRequest();
    request.setFilter(getNetworkTopApplicationsFilter(filterOptions));
    return request;
  };
  const formatData = (data) => {
    return data.hasError() ? data.toObject() : data.toObject().applicationList;
  };
  return setupRpcMethodPromise(id, "rpcGetNetworkTopApplications", getRequest, formatData);
};

const rpcGetNetworkPeers = (call) => {
  setupRpcCall(call, "rpcGetNetworkPeers");
};

const getNetworkPeers = (id) => {
  const getRequest = () => {
    let request = new messages.NetworkPeersRequest();
    return request;
  };
  const formatData = (data) => {
    return data.hasError() ? data.toObject() : data.toObject().peerList;
  };
  return setupRpcMethodPromise(id, "rpcGetNetworkPeers", getRequest, formatData);
};

const rpcDeleteNetworkPeer = (call) => {
  setupRpcCall(call, "rpcDeleteNetworkPeer");
};

const deleteNetworkPeer = (id, peerIp) => {
  const getRequest = () => {
    let request = new messages.NetworkPeerDeleteRequest();
    request.setPeerIp(peerIp);
    return request;
  };
  const formatData = (data) => {
    return data.hasError() ? data.toObject() : { message: "Peer deleted." };
  };
  return setupRpcMethodPromise(id, "rpcDeleteNetworkPeer", getRequest, formatData);
};

const rpcGetNetworkInterfaceTraffic = (call) => {
  setupRpcCall(call, "rpcGetNetworkInterfaceTraffic");
};

const getNetworkInterfaceTraffic = (id, period) => {
  const getRequest = () => {
    let request = new messages.NetworkInterfaceTrafficRequest();
    request.setPeriod(getReportPeriod(period));
    return request;
  };
  const formatData = (data) => {
    return data.hasError() ? data.toObject() : data.toObject().reportList;
  };
  return setupRpcMethodPromise(id, "rpcGetNetworkInterfaceTraffic", getRequest, formatData);
};

const rpcGetNetworkOptimizationLanToWan = (call) => {
  setupRpcCall(call, "rpcGetNetworkOptimizationLanToWan");
};

const getNetworkOptimizationLanToWan = (id, period, peerIp) => {
  const getRequest = () => {
    let request = new messages.NetworkOptimizationLanToWanRequest();
    request.setPeriod(getReportPeriod(period));
    request.setPeerIp(peerIp);
    return request;
  };
  const formatData = (data) => {
    return data.hasError() ? data.toObject() : data.toObject().report;
  };
  return setupRpcMethodPromise(id, "rpcGetNetworkOptimizationLanToWan", getRequest, formatData);
};

const rpcGetNetworkOptimizationWanToLan = (call) => {
  setupRpcCall(call, "rpcGetNetworkOptimizationWanToLan");
};

const getNetworkOptimizationWanToLan = (id, period, peerIp) => {
  const getRequest = () => {
    let request = new messages.NetworkOptimizationWanToLanRequest();
    request.setPeriod(getReportPeriod(period));
    request.setPeerIp(peerIp);
    return request;
  };
  const formatData = (data) => {
    return data.hasError() ? data.toObject() : data.toObject().report;
  };
  return setupRpcMethodPromise(id, "rpcGetNetworkOptimizationWanToLan", getRequest, formatData);
};

const rpcGetNetworkOptimizationPassThrough = (call) => {
  setupRpcCall(call, "rpcGetNetworkOptimizationPassThrough");
};

const getNetworkOptimizationPassThrough = (id, period) => {
  const getRequest = () => {
    let request = new messages.NetworkOptimizationPassThroughRequest();
    request.setPeriod(getReportPeriod(period));
    return request;
  };
  const formatData = (data) => {
    return data.hasError() ? data.toObject() : data.toObject().report;
  };
  return setupRpcMethodPromise(id, "rpcGetNetworkOptimizationPassThrough", getRequest, formatData);
};

const rpcGetNetworkOptimizationRatios = (call) => {
  setupRpcCall(call, "rpcGetNetworkOptimizationRatios");
};

const getNetworkOptimizationRatios = (id, period, peerIp) => {
  const getRequest = () => {
    let request = new messages.NetworkOptimizationRatiosRequest();
    request.setPeriod(getReportPeriod(period));
    request.setPeerIp(peerIp);
    return request;
  };
  const formatData = (data) => {
    return data.hasError() ? data.toObject() : data.toObject().report;
  };
  return setupRpcMethodPromise(id, "rpcGetNetworkOptimizationRatios", getRequest, formatData);
};

const rpcGetNetworkQosReport = (call) => {
  setupRpcCall(call, "rpcGetNetworkQosReport");
};

const getNetworkQosReport = (id, period, classNumber) => {
  const getRequest = () => {
    let request = new messages.NetworkQosReportRequest();
    request.setPeriod(getReportPeriod(period));
    if (classNumber !== undefined && classNumber !== null) {
      let qosClass = new messages.NetworkQosClassNumber();
      qosClass.setValue(parseInt(classNumber));
      request.setQosClass(qosClass);
    }
    return request;
  };
  const formatData = (data) => {
    return data.hasError() ? data.toObject() : data.toObject().reportList;
  };
  return setupRpcMethodPromise(id, "rpcGetNetworkQosReport", getRequest, formatData);
};

const rpcGetNetworkInterfaces = (call) => {
  setupRpcCall(call, "rpcGetNetworkInterfaces");
};

const getNetworkInterfaces = (id) => {
  const getRequest = () => {
    let request = new messages.NetworkInterfacesRequest();
    return request;
  };
  const formatData = (data) => {
    return data.hasError() ? data.toObject() : data.toObject().networkInterfaceList;
  };
  return setupRpcMethodPromise(id, "rpcGetNetworkInterfaces", getRequest, formatData);
};

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

const getNetworkSessionsFilter = (filterOptions) => {
  let peer = filterOptions.peer ? filterOptions.peer.toLowerCase() : "any";
  let application = parseInt(filterOptions.application) || 0;
  let port = parseInt(filterOptions.port) || 0;
  let minBytes = parseInt(filterOptions.minBytes) || 0;
  let directionOption = filterOptions.direction ? filterOptions.direction.toUpperCase() : "ANY";
  let direction = null;
  switch (directionOption) {
    case "ANY":
      direction = messages.NetworkDirectionEnum.BOTH;
      break;
    case "IN":
      direction = messages.NetworkDirectionEnum.WAN_IN;
      break;
    case "OUT":
      direction = messages.NetworkDirectionEnum.WAN_OUT;
      break;
    default:
      direction = messages.NetworkDirectionEnum.BOTH;
      break;
  }
  let period = parseInt(filterOptions.period) || 86400;
  if (period > 86400) {
    throw new InvalidArgumentApiError("period", "Period out of range.", ValidationCode.MAX_RANGE);
  }
  let orderByOption = filterOptions.orderBy || "reduction";
  let orderBy = null;
  switch (orderByOption) {
    case "reduction":
      orderBy = messages.NetworkOrderByEnum.REDUCTION;
      break;
    case "source":
      orderBy = messages.NetworkOrderByEnum.SOURCE;
      break;
    case "destination":
      orderBy = messages.NetworkOrderByEnum.DESTINATION;
      break;
    case "bytesLan":
      orderBy = messages.NetworkOrderByEnum.BYTES_LAN;
      break;
    case "bytesWan":
      orderBy = messages.NetworkOrderByEnum.BYTES_WAN;
      break;
    case "appId":
      orderBy = messages.NetworkOrderByEnum.APPLICATION;
      break;
    case "time":
      orderBy = messages.NetworkOrderByEnum.TIME;
      break;
    default:
      orderBy = messages.NetworkOrderByEnum.REDUCTION;
      break;
  }
  let sortOption = filterOptions.sort ? filterOptions.sort.toLowerCase() : "desc";
  let sort = null;
  switch (sortOption) {
    case "desc":
      sort = messages.NetworkSortDirectionEnum.DESCENDING;
      break;
    case "asc":
      sort = messages.NetworkSortDirectionEnum.ASCENDING;
      break;
    default:
      sort = messages.NetworkSortDirectionEnum.DESCENDING;
      break;
  }
  let limit = parseInt(filterOptions.limit) || 50;
  let page = parseInt(filterOptions.page) || 1;

  let filter = new messages.NetworkSessionsFilter();
  filter.setPeer(peer);
  filter.setApplication(application);
  filter.setPort(port);
  filter.setMinBytes(minBytes);
  filter.setDirection(direction);
  filter.setPeriod(period);
  filter.setOrderBy(orderBy);
  filter.setSort(sort);
  filter.setLimit(limit);
  filter.setPage(page);
  return filter;
};

const getNetworkSessionDetailFilter = (filterOptions) => {
  let orderByOption = filterOptions.orderBy || "reduction";
  let orderBy = null;
  switch (orderByOption) {
    case "reduction":
      orderBy = messages.NetworkOrderByEnum.REDUCTION;
      break;
    case "source":
      orderBy = messages.NetworkOrderByEnum.SOURCE;
      break;
    case "destination":
      orderBy = messages.NetworkOrderByEnum.DESTINATION;
      break;
    case "bytesLan":
      orderBy = messages.NetworkOrderByEnum.BYTES_LAN;
      break;
    case "bytesWan":
      orderBy = messages.NetworkOrderByEnum.BYTES_WAN;
      break;
    case "appId":
      orderBy = messages.NetworkOrderByEnum.APPLICATION;
      break;
    case "time":
      orderBy = messages.NetworkOrderByEnum.TIME;
      break;
    default:
      orderBy = messages.NetworkOrderByEnum.REDUCTION;
      break;
  }
  let sortOption = filterOptions.sort ? filterOptions.sort.toLowerCase() : "desc";
  let sort = null;
  switch (sortOption) {
    case "desc":
      sort = messages.NetworkSortDirectionEnum.DESCENDING;
      break;
    case "asc":
      sort = messages.NetworkSortDirectionEnum.ASCENDING;
      break;
    default:
      sort = messages.NetworkSortDirectionEnum.DESCENDING;
      break;
  }
  let limit = parseInt(filterOptions.limit) || 50;
  let page = parseInt(filterOptions.page) || 1;

  let filter = new messages.NetworkSessionDetailFilter();
  filter.setSource(filterOptions.source);
  filter.setDestination(filterOptions.destination);
  filter.setOrderBy(orderBy);
  filter.setSort(sort);
  filter.setLimit(limit);
  filter.setPage(page);
  return filter;
};

const getNetworkTopApplicationsFilter = (filterOptions) => {
  let peer = filterOptions.peer ? filterOptions.peer.toLowerCase() : "any";
  let top = parseInt(filterOptions.top) || 1;
  let period = parseInt(filterOptions.period) || 86400;
  if (period > 86400) {
    throw new InvalidArgumentApiError("period", "Period out of range.", ValidationCode.MAX_RANGE);
  }

  let filter = new messages.NetworkTopApplicationsFilter();
  filter.setPeer(peer);
  filter.setTop(top);
  filter.setPeriod(period);
  return filter;
};

module.exports = {
  rpcGetNetworkApplications,
  getNetworkApplications,
  rpcGetNetworkSessions,
  getNetworkSessions,
  rpcGetNetworkSessionDetail,
  getNetworkSessionDetail,
  rpcGetNetworkTopApplications,
  getNetworkTopApplications,
  rpcGetNetworkPeers,
  getNetworkPeers,
  rpcDeleteNetworkPeer,
  deleteNetworkPeer,
  rpcGetNetworkInterfaceTraffic,
  getNetworkInterfaceTraffic,
  rpcGetNetworkOptimizationLanToWan,
  getNetworkOptimizationLanToWan,
  rpcGetNetworkOptimizationWanToLan,
  getNetworkOptimizationWanToLan,
  rpcGetNetworkOptimizationPassThrough,
  getNetworkOptimizationPassThrough,
  rpcGetNetworkOptimizationRatios,
  getNetworkOptimizationRatios,
  rpcGetNetworkQosReport,
  getNetworkQosReport,
  rpcGetNetworkInterfaces,
  getNetworkInterfaces
};