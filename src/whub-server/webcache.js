const messages = require("./grpc/webcache_pb");
const { setupRpcCall, setupRpcMethodPromise } = require("./rpc-helpers");
const { isNumber } = require("../utils/helpers");
const { ValidationCode, InvalidArgumentApiError } = require("../services/errors");

const rpcGetWebcacheDates = (call) => {
  setupRpcCall(call, "rpcGetWebcacheDates");
};

const getWebcacheDates = (id) => {
  const getRequest = () => {
    return new messages.WebcacheDatesRequest();
  };
  const formatData = (data) => {
    let result = data.toObject();
    return result.yearList;
  };
  return setupRpcMethodPromise(id, "rpcGetWebcacheDates", getRequest, formatData);
};

const rpcGetWebcacheTotals = (call) => {
  setupRpcCall(call, "rpcGetWebcacheTotals");
};

const getWebcacheTotals = (id, year, month = 0, day = 0, week = 0) => {
  const getRequest = () => {
    let request = new messages.WebcacheTotalsRequest();
    request.setDateFilter(getWebcacheDateFilter(year, month, day, week));
    return request;
  };
  const formatData = (data) => {
    return data.toObject();
  };
  return setupRpcMethodPromise(id, "rpcGetWebcacheTotals", getRequest, formatData);
};

const rpcGetWebcacheDomains = (call) => {
  setupRpcCall(call, "rpcGetWebcacheDomains");
};

const getWebcacheDomains = (id, year, month = 0, day = 0, week = 0, orderBy = "bytes") => {
  const getRequest = () => {
    let request = new messages.WebcacheDomainsRequest();
    request.setDateFilter(getWebcacheDateFilter(year, month, day, week));
    request.setOrderBy(getWebcacheOrderByEnum(orderBy));
    return request;
  };
  const formatData = (data) => {
    return data.hasError() ? data.toObject() : data.toObject().domainList;
  };
  return setupRpcMethodPromise(id, "rpcGetWebcacheDomains", getRequest, formatData);
};

const rpcGetWebcacheUrls = (call) => {
  setupRpcCall(call, "rpcGetWebcacheUrls");
};

const getWebcacheUrls = (id, year, month = 0, day = 0, week = 0, orderBy = "bytes") => {
  const getRequest = () => {
    let request = new messages.WebcacheUrlsRequest();
    request.setDateFilter(getWebcacheDateFilter(year, month, day, week));
    request.setOrderBy(getWebcacheOrderByEnum(orderBy));
    return request;
  };
  const formatData = (data) => {
    return data.hasError() ? data.toObject() : data.toObject().urlList;
  };
  return setupRpcMethodPromise(id, "rpcGetWebcacheUrls", getRequest, formatData);
};

const rpcGetWebcacheDenied = (call) => {
  setupRpcCall(call, "rpcGetWebcacheDenied");
};

const getWebcacheDenied = (id, year, month = 0, day = 0, week = 0) => {
  const getRequest = () => {
    let request = new messages.WebcacheDeniedRequest();
    request.setDateFilter(getWebcacheDateFilter(year, month, day, week));
    return request;
  };
  const formatData = (data) => {
    return data.hasError() ? data.toObject() : data.toObject().deniedUrlList;
  };
  return setupRpcMethodPromise(id, "rpcGetWebcacheDenied", getRequest, formatData);
};

const rpcGetWebcacheUsers = (call) => {
  setupRpcCall(call, "rpcGetWebcacheUsers");
};

const getWebcacheUsers = (id, year, month = 0, day = 0, week = 0, orderBy = "bytes") => {
  const getRequest = () => {
    let request = new messages.WebcacheUsersRequest();
    request.setDateFilter(getWebcacheDateFilter(year, month, day, week));
    request.setOrderBy(getWebcacheOrderByEnum(orderBy));
    return request;
  };
  const formatData = (data) => {
    return data.hasError() ? data.toObject() : data.toObject().userList;
  };
  return setupRpcMethodPromise(id, "rpcGetWebcacheUsers", getRequest, formatData);
};

const rpcGetWebcacheUserDetail = (call) => {
  setupRpcCall(call, "rpcGetWebcacheUserDetail");
};

const getWebcacheUserDetail = (id, user, year, month = 0, day = 0, week = 0, orderBy = "bytes") => {
  const getRequest = () => {
    let request = new messages.WebcacheUserDetailRequest();
    request.setUser(user);
    request.setDateFilter(getWebcacheDateFilter(year, month, day, week));
    request.setOrderBy(getWebcacheOrderByEnum(orderBy));
    return request;
  };
  const formatData = (data) => {
    return data.toObject();
  };
  return setupRpcMethodPromise(id, "rpcGetWebcacheUserDetail", getRequest, formatData);
};

const rpcGetWebcacheNetworks = (call) => {
  setupRpcCall(call, "rpcGetWebcacheNetworks");
};

const getWebcacheNetworks = (id, year, month = 0, day = 0, week = 0, orderBy = "bytes") => {
  const getRequest = () => {
    let request = new messages.WebcacheNetworksRequest();
    request.setDateFilter(getWebcacheDateFilter(year, month, day, week));
    request.setOrderBy(getWebcacheOrderByEnum(orderBy));
    return request;
  };
  const formatData = (data) => {
    return data.hasError() ? data.toObject() : data.toObject().networkList;
  };
  return setupRpcMethodPromise(id, "rpcGetWebcacheNetworks", getRequest, formatData);
};

const rpcGetWebcacheNetworkDetail = (call) => {
  setupRpcCall(call, "rpcGetWebcacheNetworkDetail");
};

const getWebcacheNetworkDetail = (id, network, year, month = 0, day = 0, week = 0, orderBy = "bytes") => {
  const getRequest = () => {
    let request = new messages.WebcacheNetworkDetailRequest();
    request.setNetwork(network);
    request.setDateFilter(getWebcacheDateFilter(year, month, day, week));
    request.setOrderBy(getWebcacheOrderByEnum(orderBy));
    return request;
  };
  const formatData = (data) => {
    return data.toObject();
  };
  return setupRpcMethodPromise(id, "rpcGetWebcacheNetworkDetail", getRequest, formatData);
};

const rpcGetWebcacheMimeTypes = (call) => {
  setupRpcCall(call, "rpcGetWebcacheMimeTypes");
};

const getWebcacheMimeTypes = (id, year, month = 0, day = 0, week = 0, orderBy = "bytes") => {
  const getRequest = () => {
    let request = new messages.WebcacheMimeTypesRequest();
    request.setDateFilter(getWebcacheDateFilter(year, month, day, week));
    request.setOrderBy(getWebcacheOrderByEnum(orderBy));
    return request;
  };
  const formatData = (data) => {
    return data.hasError() ? data.toObject() : data.toObject().mimeTypeList;
  };
  return setupRpcMethodPromise(id, "rpcGetWebcacheMimeTypes", getRequest, formatData);
};

const getWebcacheOrderByEnum = (orderByString) => {
  switch (orderByString) {
    case "bytes":
      return messages.WebcacheOrderByEnum.BYTES;
    case "requests":
      return messages.WebcacheOrderByEnum.REQUESTS;
    case "duration":
      return messages.WebcacheOrderByEnum.DURATION;
    case "users":
      return messages.WebcacheOrderByEnum.USERS;
    case "largest":
      return messages.WebcacheOrderByEnum.LARGEST;
    default:
      return messages.WebcacheOrderByEnum.BYTES;
  }
};

const getWebcacheDateFilter = (year, month = 0, day = 0, week = 0) => {
  if (!isNumber(year)) throw new InvalidArgumentApiError("year", "Year parameter is not a number.", ValidationCode.INVALID_TYPE);
  if (!isNumber(month)) throw new InvalidArgumentApiError("month", "Month parameter is not a number.", ValidationCode.INVALID_TYPE);
  if (!isNumber(day)) throw new InvalidArgumentApiError("day", "Day parameter is not a number.", ValidationCode.INVALID_TYPE);
  if (!isNumber(week)) throw new InvalidArgumentApiError("week", "Week parameter is not a number.", ValidationCode.INVALID_TYPE);
  let dateFilter = new messages.WebcacheDateFilter();
  dateFilter.setYear(Number(year));
  dateFilter.setMonth(Number(month));
  dateFilter.setDay(Number(day));
  dateFilter.setWeek(Number(week));
  return dateFilter;
};

module.exports = {
  rpcGetWebcacheDates,
  getWebcacheDates,
  rpcGetWebcacheTotals,
  getWebcacheTotals,
  rpcGetWebcacheDomains,
  getWebcacheDomains,
  rpcGetWebcacheUrls,
  getWebcacheUrls,
  rpcGetWebcacheDenied,
  getWebcacheDenied,
  rpcGetWebcacheUsers,
  getWebcacheUsers,
  rpcGetWebcacheUserDetail,
  getWebcacheUserDetail,
  rpcGetWebcacheNetworks,
  getWebcacheNetworks,
  rpcGetWebcacheNetworkDetail,
  getWebcacheNetworkDetail,
  rpcGetWebcacheMimeTypes,
  getWebcacheMimeTypes
};