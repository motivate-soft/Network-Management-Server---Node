const messages = require("./grpc/license_pb");
const { setupRpcCall, setupRpcMethodPromise } = require("./rpc-helpers");

// --------------------------------------------
const rpcGetLicense = (call) => {
  setupRpcCall(call, "rpcGetLicense");
};

const getLicense = (id) => {
  const getRequest = () => {
    let request = new messages.LicenseGetRequest();
    return request;
  };
  const formatData = (data) => {
  	return data.hasError() ? data.toObject() : data.toObject().license;
  };
  return setupRpcMethodPromise(id, "rpcGetLicense", getRequest, formatData);
};

// --------------------------------------------
const rpcAddLicense = (call) => {
  setupRpcCall(call, "rpcAddLicense");
};

const addLicense = (id, license, token) => {
  const getRequest = () => {
    let request = new messages.LicenseAddRequest();
    request.setLicense(license);
    request.setToken(token);
    return request;
  };
  const formatData = (data) => {
  	return data.hasError() ? data.toObject() : data.toObject().license;
  };
  return setupRpcMethodPromise(id, "rpcAddLicense", getRequest, formatData);
};

module.exports = {
	rpcGetLicense,
  getLicense,
  rpcAddLicense,
  addLicense
}