const EventEmitter = require("events");
const ObjectId = require("mongodb").ObjectId;
const grpc = require("grpc");
const messages = require("./grpc/device_pb");
const services = require("./grpc/wanos_hub_grpc_pb");
const logger = require("../utils/logger");
const deviceRepo = require("../services/device-repo");
const { onlineDevices } = require("./rpc-helpers");
const dashboard = require("./dashboard");
const webcache = require("./webcache");
const network = require("./network");
const system = require("./system");
const diagnostic = require("./diagnostic");
const configure = require("./configure");
const status = require("./status");
const license = require("./license");
const { Patcher } = require("./patcher");
const { MaintenanceController } = require("./maintenance");

const patcher = new Patcher();
const maintenance = new MaintenanceController();

// Events
class EventManager extends EventEmitter {}
const wHubEvents = {
  ONLINE_DEVICES_UPDATED: "ONLINE_DEVICES_UPDATED"
};
// Variables
const eventManager = new EventManager();
let config = {};
let grpcServer = null;
let pollStatsTimer = null;

function cleanup() {
  if (grpcServer) {
    logger.info("Shutting down gRPC server");
    grpcServer.forceShutdown();
  }
}

async function updateDevice(device, registerDevice) {
  device = { ...device, ...registerDevice };
  // Delete the id property as we will use MongoDb's _id instead
  delete device.id;
  let updatedDeviceResult = await deviceRepo.updateDevice(device);
  return updatedDeviceResult.value;
}

function isValidRegisterReq(registerRequest) {
  if (registerRequest.id && !ObjectId.isValid(registerRequest.id)) {
    return false;
  }

  if (!registerRequest.mac || !registerRequest.mac.match(/^([0-9a-fA-F]{2}[:-]){5}([0-9a-fA-F]{2})$/)) {
    return false;
  }

  if (!registerRequest.ip || !registerRequest.ip.match(/^([\d]{1,3}.){3}[\d]{1,3}$/)) {
    return false;
  }

  if (!registerRequest.hostname) {
    return false;
  }

  return true;
}

async function findOrInsertDevice(registerRequest) {
  let device = null;

  if (!isValidRegisterReq(registerRequest)) {
    return null;
  }

  if (registerRequest.id && ObjectId.isValid(registerRequest.id)) {
    device = await deviceRepo.getDevice(registerRequest.id);
    if (device) {
      device = await updateDevice(device, registerRequest);
      return device;
    }
  }
  if (registerRequest.mac) {
    device = await deviceRepo.getDeviceByMac(registerRequest.mac);
    if (device) {
      device = await updateDevice(device, registerRequest);
      return device;
    }
  }
  device = { ...device, ...registerRequest };
  // Delete the id property as we will use MongoDb's _id instead
  delete device.id;
  device.orgId = config.defaultOrgId;
  let stats = new messages.DeviceStats();
  stats.setMem(new messages.MemInfo());
  stats.setNet(new messages.NetworkStats());
  device.stats = stats.toObject();
  await deviceRepo.insertDevice(device);
  return device;
}

async function rpcRegisterDevice(call, callback) {
  let registerRequest = call.request.toObject();
  let device = await findOrInsertDevice(registerRequest);
  let response = new messages.RegisterResponse();
  if (device) {
    response.setId(device._id.toHexString());
    response.setOrgId(device.orgId.toHexString());
  }
  callback(null, response);
}

async function rpcDeviceStatsReport(call) {
  let metadata = call.metadata.getMap();
  let device = onlineDevices.get(metadata.id);
  let shouldSetDeviceOffline = false;
  // If we already have an online device with this id,
  // then end that session as we can only have a single rpc stream per device.
  if (device) {
    logger.info(`rpcDeviceStatsReport device already online, ending old stream: ${device.rpcPeer}`);
    device.oldStream = true;
    device.call.end();
    onlineDevices.delete(metadata.id);
    shouldSetDeviceOffline = true;
    eventManager.emit(wHubEvents.ONLINE_DEVICES_UPDATED);
  }
  device = {
    call: call,
    rpcPeer: call.getPeer()
  };
  onlineDevices.set(metadata.id, device);
  if (shouldSetDeviceOffline) {
    await deviceRepo.setDeviceOffline(metadata.id);
  }
  await deviceRepo.setDeviceOnline(metadata.id);
  eventManager.emit(wHubEvents.ONLINE_DEVICES_UPDATED);

  call.on("data", (deviceStats) => {
    deviceRepo.updateDeviceStats(ObjectId(metadata.id), deviceStats.toObject());
  });
  call.on("end", async () => {
    if (device.oldStream) {
      // If this is an old stream that was replaced by a new one then do not delete
      // from onlineDevices, as it already point to the new stream.
    } else {
      onlineDevices.delete(metadata.id);
      await deviceRepo.setDeviceOffline(metadata.id);
      eventManager.emit(wHubEvents.ONLINE_DEVICES_UPDATED);
    }
    call.end();
  });
  call.on("error", async (err) => {
    logger.info("rpcDeviceStatsReport ERROR:", err);
    onlineDevices.delete(metadata.id);
    await deviceRepo.setDeviceOffline(metadata.id);
    eventManager.emit(wHubEvents.ONLINE_DEVICES_UPDATED);
  });
}

function rpcUpdatePeers(call) {
  let metadata = call.metadata.getMap();
  call.on("data", (peersReport) => {
    deviceRepo.updateDevicePeers(metadata.id, peersReport.toObject().peersList);
    eventManager.emit(wHubEvents.ONLINE_DEVICES_UPDATED);
  });
}

function getDeviceStats(ids) {
  for (let id of ids) {
    let device = onlineDevices.get(id);
    if (!device) {
      continue;
    }
    let request = new messages.DeviceStatsRequest();
    device.call.write(request);
  }
}

function getAllDevicesStats() {
  var ids = Array.from(onlineDevices.keys());
  getDeviceStats(ids);
}

function startPollStats(intervalMs) {
  if (pollStatsTimer) {
    clearInterval(pollStatsTimer);
    pollStatsTimer = null;
  }
  pollStatsTimer = setInterval(() => {
    getAllDevicesStats();
  }, intervalMs);
}

function stopPollStats() {
  if (pollStatsTimer) {
    clearInterval(pollStatsTimer);
    pollStatsTimer = null;
  }
}

function startRpcServer() {
  grpcServer = new grpc.Server({
    "grpc.keepalive_time_ms": 10000,
    "grpc.keepalive_timeout_ms": 10000,
    "rpc.keepalive_permit_without_calls": 1,
    "grpc.http2.max_pings_without_data": 0,
    "grpc.http2.min_ping_interval_without_data_ms": 5000,
    "grpc.http2.min_time_between_pings_ms": 10000
  });
  grpcServer.addService(services.WHubService, {
    register: rpcRegisterDevice,
    deviceStatsReport: rpcDeviceStatsReport,
    updatePeers: rpcUpdatePeers,
    // Dashboard
    getDashboardData: dashboard.rpcGetDashboardData,
    getDashboardTopPorts: dashboard.rpcGetDashboardTopPorts,
    // Webcache
    getWebcacheDates: webcache.rpcGetWebcacheDates,
    getWebcacheTotals: webcache.rpcGetWebcacheTotals,
    getWebcacheDomains: webcache.rpcGetWebcacheDomains,
    getWebcacheUrls: webcache.rpcGetWebcacheUrls,
    getWebcacheDenied: webcache.rpcGetWebcacheDenied,
    getWebcacheUsers: webcache.rpcGetWebcacheUsers,
    getWebcacheUserDetail: webcache.rpcGetWebcacheUserDetail,
    getWebcacheNetworks: webcache.rpcGetWebcacheNetworks,
    getWebcacheNetworkDetail: webcache.rpcGetWebcacheNetworkDetail,
    getWebcacheMimeTypes: webcache.rpcGetWebcacheMimeTypes,
    // Network
    getNetworkApplications: network.rpcGetNetworkApplications,
    getNetworkSessions: network.rpcGetNetworkSessions,
    getNetworkSessionDetail: network.rpcGetNetworkSessionDetail,
    getNetworkTopApplications: network.rpcGetNetworkTopApplications,
    getNetworkPeers: network.rpcGetNetworkPeers,
    deleteNetworkPeer: network.rpcDeleteNetworkPeer,
    getNetworkInterfaceTraffic: network.rpcGetNetworkInterfaceTraffic,
    getNetworkOptimizationLanToWan: network.rpcGetNetworkOptimizationLanToWan,
    getNetworkOptimizationWanToLan: network.rpcGetNetworkOptimizationWanToLan,
    getNetworkOptimizationPassThrough: network.rpcGetNetworkOptimizationPassThrough,
    getNetworkOptimizationRatios: network.rpcGetNetworkOptimizationRatios,
    getNetworkQosReport: network.rpcGetNetworkQosReport,
    getNetworkInterfaces: network.rpcGetNetworkInterfaces,
    // System
    getSystemMemory: system.rpcGetSystemMemory,
    getSystemLoad: system.rpcGetSystemLoad,
    getSystemCpu: system.rpcGetSystemCpu,
    getSystemDiskLoad: system.rpcGetSystemDiskLoad,
    getSystemDiskSpace: system.rpcGetSystemDiskSpace,
    getSystemInfo: system.rpcGetSystemInfo,
    getSystemIndicators: system.rpcGetSystemIndicators,
    // Diagnostic
    getDiagnosticLog: diagnostic.rpcGetDiagnosticLog,
    getDiagnosticHealth: diagnostic.rpcGetDiagnosticHealth,
    getDiagnosticBenchmark: diagnostic.rpcGetDiagnosticBenchmark,
    scheduleDiagnosticBenchmark: diagnostic.rpcScheduleDiagnosticBenchmark,
    getDiagnosticNetstat: diagnostic.rpcGetDiagnosticNetstat,
    getDiagnosticPing: diagnostic.rpcGetDiagnosticPing,
    getDiagnosticTraceroute: diagnostic.rpcGetDiagnosticTraceroute,
    // Configure
    getSystemSettings: configure.rpcGetSystemSettings,
    updateSystemSettings: configure.rpcUpdateSystemSettings,
    getNetworkSettings: configure.rpcGetNetworkSettings,
    updateNetworkSettings: configure.rpcUpdateNetworkSettings,
    getOptimizationSettings: configure.rpcGetOptimizationSettings,
    updateOptimizationSettings: configure.rpcUpdateOptimizationSettings,
    getMonitorSettings: configure.rpcGetMonitorSettings,
    updateMonitorSettings: configure.rpcUpdateMonitorSettings,
    getTunnelPolicies: configure.rpcGetTunnelPolicies,
    deleteTunnelPoliciesRule: configure.rpcDeleteTunnelPoliciesRule,
    updateTunnelPoliciesRule: configure.rpcUpdateTunnelPoliciesRule,
    addTunnelPoliciesRule: configure.rpcAddTunnelPoliciesRule,
    getTrafficPolicies: configure.rpcGetTrafficPolicies,
    deleteTrafficPolicy: configure.rpcDeleteTrafficPolicy,
    updateTrafficPolicy: configure.rpcUpdateTrafficPolicy,
    addTrafficPolicy: configure.rpcAddTrafficPolicy,
    getRoutes: configure.rpcGetRoutes,
    addRoute: configure.rpcAddRoute,
    updateRoute: configure.rpcUpdateRoute,
    removeRoute: configure.rpcRemoveRoute,
    getWebcacheConfig: configure.rpcGetWebcacheConfig,
    setWebcacheConfig: configure.rpcSetWebcacheConfig,
    getTcpxRules: configure.rpcGetTcpxRules,
    addTcpxRule: configure.rpcAddTcpxRule,
    updateTcpxRule: configure.rpcUpdateTcpxRule,
    removeTcpxRule: configure.rpcRemoveTcpxRule,
    moveTcpxRule: configure.rpcMoveTcpxRule,
    getPathConfig: configure.rpcGetPathConfig,
    setPathConfig: configure.rpcSetPathConfig,
    getPathGateways: configure.rpcGetPathGateways,
    removePathGateway: configure.rpcRemovePathGateway,
    resetService: configure.rpcResetService,
    changeSshPassword: configure.rpcChangeSshPassword,
    // Status
    getStatusUpdate: status.rpcGetStatusUpdate,
    // File Transfer
    downloadFile: (call, callback) => { patcher.rpcDownloadFile(call, callback); },
    // Patch
    getServerAgentVersion: (call, callback) => { patcher.rpcGetServerAgentVersion(call, callback); },
    // Maintenance
    startBackup: maintenance.rpcStartBackup,
    uploadBackup: (call, callback) => { maintenance.rpcUploadBackup(call, callback); },
    // License
    getLicense: license.rpcGetLicense,
    addLicense: license.rpcAddLicense
  });
  grpcServer.bind(`${config.rpcIp}:${config.rpcPort}`, grpc.ServerCredentials.createInsecure());
  grpcServer.start();
  logger.info(`gRPC server started on ${config.rpcIp}:${config.rpcPort}`);
}

module.exports = {
  start: async (rpcIp, rpcPort, defaultOrgId) => {
    config.rpcIp = rpcIp;
    config.rpcPort = rpcPort;
    config.defaultOrgId = defaultOrgId;
    await deviceRepo.setAllDevicesOffline();
    startRpcServer();
  },
  startPollStats,
  stopPollStats,
  cleanup,
  eventManager,
  wHubEvents,
  // Dashboard
  getDashboardData: dashboard.getDashboardData,
  getDashboardTopPorts: dashboard.getDashboardTopPorts,
  // Webcache
  getWebcacheDates: webcache.getWebcacheDates,
  getWebcacheTotals: webcache.getWebcacheTotals,
  getWebcacheDomains: webcache.getWebcacheDomains,
  getWebcacheUrls: webcache.getWebcacheUrls,
  getWebcacheDenied: webcache.getWebcacheDenied,
  getWebcacheUsers: webcache.getWebcacheUsers,
  getWebcacheUserDetail: webcache.getWebcacheUserDetail,
  getWebcacheNetworks: webcache.getWebcacheNetworks,
  getWebcacheNetworkDetail: webcache.getWebcacheNetworkDetail,
  getWebcacheMimeTypes: webcache.getWebcacheMimeTypes,
  // Network
  getNetworkApplications: network.getNetworkApplications,
  getNetworkSessions: network.getNetworkSessions,
  getNetworkSessionDetail: network.getNetworkSessionDetail,
  getNetworkTopApplications: network.getNetworkTopApplications,
  getNetworkPeers: network.getNetworkPeers,
  deleteNetworkPeer: network.deleteNetworkPeer,
  getNetworkInterfaceTraffic: network.getNetworkInterfaceTraffic,
  getNetworkOptimizationLanToWan: network.getNetworkOptimizationLanToWan,
  getNetworkOptimizationWanToLan: network.getNetworkOptimizationWanToLan,
  getNetworkOptimizationPassThrough: network.getNetworkOptimizationPassThrough,
  getNetworkOptimizationRatios: network.getNetworkOptimizationRatios,
  getNetworkQosReport: network.getNetworkQosReport,
  getNetworkInterfaces: network.getNetworkInterfaces,
  // System
  getSystemMemory: system.getSystemMemory,
  getSystemLoad: system.getSystemLoad,
  getSystemCpu: system.getSystemCpu,
  getSystemDiskLoad: system.getSystemDiskLoad,
  getSystemDiskSpace: system.getSystemDiskSpace,
  getSystemInfo: system.getSystemInfo,
  getSystemIndicators: system.getSystemIndicators,
  // Diagnostic
  getDiagnosticLog: diagnostic.getDiagnosticLog,
  getDiagnosticHealth: diagnostic.getDiagnosticHealth,
  getDiagnosticBenchmark: diagnostic.getDiagnosticBenchmark,
  scheduleDiagnosticBenchmark: diagnostic.scheduleDiagnosticBenchmark,
  getDiagnosticNetstat: diagnostic.getDiagnosticNetstat,
  getDiagnosticPing: diagnostic.getDiagnosticPing,
  getDiagnosticTraceroute: diagnostic.getDiagnosticTraceroute,
  // Configure
  getSystemSettings: configure.getSystemSettings,
  updateSystemSettings: configure.updateSystemSettings,
  getNetworkSettings: configure.getNetworkSettings,
  updateNetworkSettings: configure.updateNetworkSettings,
  getOptimizationSettings: configure.getOptimizationSettings,
  updateOptimizationSettings: configure.updateOptimizationSettings,
  getMonitorSettings: configure.getMonitorSettings,
  updateMonitorSettings: configure.updateMonitorSettings,
  getTunnelPolicies: configure.getTunnelPolicies,
  deleteTunnelPoliciesRule: configure.deleteTunnelPoliciesRule,
  updateTunnelPoliciesRule: configure.updateTunnelPoliciesRule,
  addTunnelPoliciesRule: configure.addTunnelPoliciesRule,
  getTrafficPolicies: configure.getTrafficPolicies,
  deleteTrafficPolicy: configure.deleteTrafficPolicy,
  updateTrafficPolicy: configure.updateTrafficPolicy,
  addTrafficPolicy: configure.addTrafficPolicy,
  getRoutes: configure.getRoutes,
  addRoute: configure.addRoute,
  updateRoute: configure.updateRoute,
  removeRoute: configure.removeRoute,
  getWebcacheConfig: configure.getWebcacheConfig,
  setWebcacheConfig: configure.setWebcacheConfig,
  getTcpxRules: configure.getTcpxRules,
  addTcpxRule: configure.addTcpxRule,
  updateTcpxRule: configure.updateTcpxRule,
  removeTcpxRule: configure.removeTcpxRule,
  moveTcpxRule: configure.moveTcpxRule,
  getPathConfig: configure.getPathConfig,
  setPathConfig: configure.setPathConfig,
  getPathGateways: configure.getPathGateways,
  removePathGateway: configure.removePathGateway,
  resetService: configure.resetService,
  changeSshPassword: configure.changeSshPassword,
  getStatusUpdate: status.getStatusUpdate,
  // Maintenance
  startBackup: maintenance.startBackup,
  // License
  getLicense: license.getLicense,
  addLicense: license.addLicense
};