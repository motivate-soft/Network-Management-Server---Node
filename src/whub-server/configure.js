const messages = require("./grpc/configure_pb");
const { setupRpcCall, setupRpcMethodPromise } = require("./rpc-helpers");

const rpcGetSystemSettings = (call) => {
  setupRpcCall(call, "rpcGetSystemSettings");
};

const getSystemSettings = (id) => {
  const getRequest = () => {
    let request = new messages.SystemSettingsRequest();
    return request;
  };
  const formatData = (data) => {
    if (data.hasError()) {
      return data.toObject();
    } else {
      let { requestId, error, ...result } = data.toObject();
      return result;
    }
  };
  return setupRpcMethodPromise(id, "rpcGetSystemSettings", getRequest, formatData);
};

const rpcUpdateSystemSettings = (call) => {
  setupRpcCall(call, "rpcUpdateSystemSettings");
};

const updateSystemSettings = (id, systemSettings) => {
  const getRequest = () => {
    let settings = new messages.SystemSettingsData();
    settings.setHostname(systemSettings.hostname);
    settings.setDate(systemSettings.date);
    settings.setTime(systemSettings.time);
    settings.setNtp(systemSettings.ntp);
    settings.setTimezone(systemSettings.timezone);
    settings.setSsh(systemSettings.ssh);
    settings.setDatastore(systemSettings.datastore);
    settings.setPrimary(systemSettings.primary);
    settings.setSecondary(systemSettings.secondary);
    settings.setLogLevel(systemSettings.logLevel);
    let request = new messages.SystemSettingsRequest();
    request.setSettings(settings);
    return request;
  };
  const formatData = (data) => {
    return data.toObject();
  };
  return setupRpcMethodPromise(id, "rpcUpdateSystemSettings", getRequest, formatData);
};

const rpcGetNetworkSettings = (call) => {
  setupRpcCall(call, "rpcGetNetworkSettings");
};

const getNetworkSettings = (id) => {
  const getRequest = () => {
    let request = new messages.NetworkSettingsRequest();
    return request;
  };
  const formatData = (data) => {
    return data.hasError() ? data.toObject() : data.toObject().settings;
  };
  return setupRpcMethodPromise(id, "rpcGetNetworkSettings", getRequest, formatData);
};

const rpcUpdateNetworkSettings = (call) => {
  setupRpcCall(call, "rpcUpdateNetworkSettings");
};

const updateNetworkSettings = (id, networkSettings) => {
  const getRequest = () => {
    let settings = new messages.NetworkSettingsData();
    settings.setIpMask(networkSettings.ipMask);
    settings.setGateway(networkSettings.gateway);
    settings.setDeployment(networkSettings.deployment);
    settings.setEncapsulation(networkSettings.encapsulation);
    let request = new messages.NetworkSettingsRequest();
    request.setSettings(settings);
    return request;
  };
  const formatData = (data) => {
    return data.toObject();
  };
  return setupRpcMethodPromise(id, "rpcUpdateNetworkSettings", getRequest, formatData);
};

const rpcGetOptimizationSettings = (call) => {
  setupRpcCall(call, "rpcGetOptimizationSettings");
};

const getOptimizationSettings = (id) => {
  const getRequest = () => {
    let request = new messages.OptimizationSettingsRequest();
    return request;
  };
  const formatData = (data) => {
    return data.hasError() ? data.toObject() : data.toObject().settings;
  };
  return setupRpcMethodPromise(id, "rpcGetOptimizationSettings", getRequest, formatData);
};

const rpcUpdateOptimizationSettings = (call) => {
  setupRpcCall(call, "rpcUpdateOptimizationSettings");
};

const updateOptimizationSettings = (id, optimizationSettings) => {
  const getRequest = () => {
    let settings = new messages.OptimizationSettingsData();
    settings.setPeerTimeout(optimizationSettings.peerTimeout);
    settings.setWanRate(optimizationSettings.wanRate);
    settings.setCompression(optimizationSettings.compression);
    settings.setDeduplication(optimizationSettings.deduplication);
    settings.setLossRecovery(optimizationSettings.lossRecovery);
    settings.setErrorCorrection(optimizationSettings.errorCorrection);
    settings.setAggregation(optimizationSettings.aggregation);
    settings.setAccelerator(optimizationSettings.accelerator);
    settings.setWebcache(optimizationSettings.webcache);
    let request = new messages.OptimizationSettingsRequest();
    request.setSettings(settings);
    return request;
  };
  const formatData = (data) => {
    return data.toObject();
  };
  return setupRpcMethodPromise(id, "rpcUpdateOptimizationSettings", getRequest, formatData);
};

const rpcGetMonitorSettings = (call) => {
  setupRpcCall(call, "rpcGetMonitorSettings");
};

const getMonitorSettings = (id) => {
  const getRequest = () => {
    let request = new messages.MonitorSettingsRequest();
    return request;
  };
  const formatData = (data) => {
    return data.hasError() ? data.toObject() : data.toObject().settings;
  };
  return setupRpcMethodPromise(id, "rpcGetMonitorSettings", getRequest, formatData);
};

const rpcUpdateMonitorSettings = (call) => {
  setupRpcCall(call, "rpcUpdateMonitorSettings");
};

const updateMonitorSettings = (id, monitorSettings) => {
  const getRequest = () => {
    let settings = new messages.MonitorSettingsData();
    settings.setSnmp(monitorSettings.snmp);
    settings.setNetflowExporting(monitorSettings.netflowExporting);
    if (monitorSettings.netflowIp) {
      settings.setNetflowIp(monitorSettings.netflowIp);
    }
    if (monitorSettings.netflowPort) {
      settings.setNetflowPort(monitorSettings.netflowPort);
    }
    let request = new messages.MonitorSettingsRequest();
    request.setSettings(settings);
    return request;
  };
  const formatData = (data) => {
    return data.toObject();
  };
  return setupRpcMethodPromise(id, "rpcUpdateMonitorSettings", getRequest, formatData);
};

const rpcGetTunnelPolicies = (call) => {
  setupRpcCall(call, "rpcGetTunnelPolicies");
};

const getTunnelPolicies = (id) => {
  const getRequest = () => {
    let request = new messages.TunnelPoliciesRequest();
    return request;
  };
  const formatData = (data) => {
    return data.hasError() ? data.toObject() : data.toObject().policies;
  };
  return setupRpcMethodPromise(id, "rpcGetTunnelPolicies", getRequest, formatData);
};

const rpcDeleteTunnelPoliciesRule = (call) => {
  setupRpcCall(call, "rpcDeleteTunnelPoliciesRule");
};

const deleteTunnelPoliciesRule = (id, ruleId) => {
  const getRequest = () => {
    let request = new messages.TunnelPoliciesDeleteRuleRequest();
    request.setRuleId(parseInt(ruleId));
    return request;
  };
  const formatData = (data) => {
    return data.hasError() ? data.toObject() : { message: "Rule deleted." };
  };
  return setupRpcMethodPromise(id, "rpcDeleteTunnelPoliciesRule", getRequest, formatData);
};

const rpcUpdateTunnelPoliciesRule = (call) => {
  setupRpcCall(call, "rpcUpdateTunnelPoliciesRule");
};

const updateTunnelPoliciesRule = (id, tunnelRule) => {
  const getRequest = () => {
    let rule = new messages.TunnelRule();
    rule.setRuleId(tunnelRule.ruleId);
    rule.setDestination(tunnelRule.destination);
    rule.setTunnelId(tunnelRule.tunnelId);
    rule.setPeerIp(tunnelRule.peerIp);
    rule.setSharedKey(tunnelRule.sharedKey);
    rule.setDescription(tunnelRule.description);
    let request = new messages.TunnelPoliciesUpdateRuleRequest();
    request.setRule(rule);
    return request;
  };
  const formatData = (data) => {
    return data.hasError() ? data.toObject() : { message: "Rule updated." };
  };
  return setupRpcMethodPromise(id, "rpcUpdateTunnelPoliciesRule", getRequest, formatData);
};

const rpcAddTunnelPoliciesRule = (call) => {
  setupRpcCall(call, "rpcAddTunnelPoliciesRule");
};

const addTunnelPoliciesRule = (id, tunnelRule) => {
  const getRequest = () => {
    let rule = new messages.TunnelRule();
    rule.setRuleId(0);
    rule.setDestination(tunnelRule.destination);
    rule.setTunnelId(tunnelRule.tunnelId);
    rule.setPeerIp(tunnelRule.peerIp);
    rule.setSharedKey(tunnelRule.sharedKey);
    rule.setDescription(tunnelRule.description);
    let request = new messages.TunnelPoliciesAddRuleRequest();
    request.setRule(rule);
    return request;
  };
  const formatData = (data) => {
    return data.hasError() ? data.toObject() : data.toObject().rule;
  };
  return setupRpcMethodPromise(id, "rpcAddTunnelPoliciesRule", getRequest, formatData);
};

const rpcGetPathConfig = (call) => {
  setupRpcCall(call, "rpcGetPathConfig");
}

const getPathConfig = (id) => {
  const getRequest = () => {
    let request = new messages.GetPathConfigRequest();
    return request;
  };
  const formatData = (data) => {
    return data.hasError() ? data.toObject() : data.toObject().config;
  };
  return setupRpcMethodPromise(id, "rpcGetPathConfig", getRequest, formatData);
}

const rpcGetPathGateways = (call) => {
  setupRpcCall(call, "rpcGetPathGateways");
}

const getPathGateways = (id) => {
  const getRequest = () => {
    let request = new messages.GetPathsRequest();
    return request;
  };
  const formatData = (data) => {
    return data.hasError() ? data.toObject() : data.toObject().pathsList;
  };
  return setupRpcMethodPromise(id, "rpcGetPathGateways", getRequest, formatData);
}

const rpcRemovePathGateway = (call) => {
  setupRpcCall(call, "rpcRemovePathGateway");
}

const removePathGateway = (id, type) => {
  const getRequest = () => {
    let request = new messages.RemovePathRequest();
    request.setIsPrimary(type === 'primary');
    return request;
  };
  const formatData = (data) => {
    return data.hasError() ? data.toObject() : data.toObject().pathsList;
  };
  return setupRpcMethodPromise(id, "rpcRemovePathGateway", getRequest, formatData);
}

const rpcSetPathConfig = (call) => {
  setupRpcCall(call, "rpcSetPathConfig");
}

const setPathConfig = (id, config) => {
  const getRequest = () => {
    let request = new messages.SetPathConfigRequest();
    let pathConfig = new messages.PathConfig();
    pathConfig.setMultiWan(config.multiWan);
    pathConfig.setFailOver(config.failOver);
    pathConfig.setPreempt(config.preempt);
    pathConfig.setTrackPeer(config.trackPeer);
    pathConfig.setTimeout(config.timeout);
    request.setConfig(pathConfig);
    return request;
  };
  const formatData = (data) => {
    return data.hasError() ? data.toObject() : data.toObject().config;
  };
  return setupRpcMethodPromise(id, "rpcSetPathConfig", getRequest, formatData);
}

const rpcGetRoutes = (call) => {
  setupRpcCall(call, "rpcGetRoutes");
};

const getRoutes = (id) => {
  const getRequest = () => {
    let request = new messages.RoutesRequest();
    return request;
  };
  const formatData = (data) => {
    return data.hasError() ? data.toObject() : data.toObject().routesList;
  };
  return setupRpcMethodPromise(id, "rpcGetRoutes", getRequest, formatData);
};

const rpcAddRoute = (call) => {
  setupRpcCall(call, "rpcAddRoute");
};

const addRoute = (id, newRoute) => {
  const getRequest = () => {
    let route = new messages.Route();
    route.setDestination(newRoute.destination);
    route.setGateway(newRoute.gateway);
    let request = new messages.RouteAddRequest();
    request.setRoute(route);
    return request;
  };
  const formatData = (data) => {
    return data.hasError() ? data.toObject() : {ruleId: data.getRuleId()};
  };
  return setupRpcMethodPromise(id, "rpcAddRoute", getRequest, formatData);
};

const rpcUpdateRoute = (call) => {
  setupRpcCall(call, "rpcUpdateRoute");
};

const updateRoute = (id, editedRoute) => {
  const getRequest = () => {
    let route = new messages.Route();
    route.setRuleId(editedRoute.ruleId);
    route.setDestination(editedRoute.destination);
    route.setGateway(editedRoute.gateway);
    let request = new messages.RouteUpdateRequest();
    request.setRoute(route);
    return request;
  };
  const formatData = (data) => {
    return data.hasError() ? data.toObject() : { message: "Route updated." };
  };
  return setupRpcMethodPromise(id, "rpcUpdateRoute", getRequest, formatData);
};

const rpcRemoveRoute = (call) => {
  setupRpcCall(call, "rpcRemoveRoute");
};

const removeRoute = (id, ruleId) => {
  const getRequest = () => {
    let request = new messages.RouteRemoveRequest();
    request.setRuleId(ruleId);
    return request;
  };
  const formatData = (data) => {
    return data.hasError() ? data.toObject() : { message: "Route removed." };
  };
  return setupRpcMethodPromise(id, "rpcRemoveRoute", getRequest, formatData);
};

const rpcGetTrafficPolicies = (call) => {
  setupRpcCall(call, "rpcGetTrafficPolicies");
};

const getTrafficPolicies = (id) => {
  const getRequest = () => {
    let request = new messages.TrafficPoliciesRequest();
    return request;
  };
  const formatData = (data) => {
    return data.hasError() ? data.toObject() : data.toObject().policies;
  };
  return setupRpcMethodPromise(id, "rpcGetTrafficPolicies", getRequest, formatData);
};

const rpcDeleteTrafficPolicy = (call) => {
  setupRpcCall(call, "rpcDeleteTrafficPolicy");
};

const deleteTrafficPolicy = (id, ruleId) => {
  const getRequest = () => {
    let request = new messages.TrafficPolicyDeleteRequest();
    request.setRuleId(parseInt(ruleId));
    return request;
  };
  const formatData = (data) => {
    return data.hasError() ? data.toObject() : { message: "Policy deleted." };
  };
  return setupRpcMethodPromise(id, "rpcDeleteTrafficPolicy", getRequest, formatData);
};

const rpcUpdateTrafficPolicy = (call) => {
  setupRpcCall(call, "rpcUpdateTrafficPolicy");
};

const updateTrafficPolicy = (id, trafficPolicy) => {
  const getRequest = () => {
    let policy = parseTrafficPolicy(trafficPolicy);
    let request = new messages.TrafficPolicyUpdateRequest();
    request.setPolicy(policy);
    return request;
  };
  const formatData = (data) => {
    return data.hasError() ? data.toObject() : { message: "Policy updated." };
  };
  return setupRpcMethodPromise(id, "rpcUpdateTrafficPolicy", getRequest, formatData);
};

const rpcAddTrafficPolicy = (call) => {
  setupRpcCall(call, "rpcAddTrafficPolicy");
};

const addTrafficPolicy = (id, trafficPolicy) => {
  const getRequest = () => {
    let policy = parseTrafficPolicy(trafficPolicy);
    let request = new messages.TrafficPolicyAddRequest();
    request.setPolicy(policy);
    return request;
  };
  const formatData = (data) => {
    return data.hasError() ? data.toObject() : data.toObject().policy;
  };
  return setupRpcMethodPromise(id, "rpcAddTrafficPolicy", getRequest, formatData);
};

const rpcGetWebcacheConfig = (call) => {
  setupRpcCall(call, "rpcGetWebcacheConfig");
};

const getWebcacheConfig = (id) => {
  const getRequest = () => {
    let request = new messages.GetWebcacheConfRequest();
    return request;
  };
  const formatData = (data) => {
    return data.hasError() ? data.toObject() : data.toObject().config ;
  };
  return setupRpcMethodPromise(id, "rpcGetWebcacheConfig", getRequest, formatData);
};

const rpcSetWebcacheConfig = (call) => {
  setupRpcCall(call, "rpcSetWebcacheConfig");
};

const setWebcacheConfig = (id, props) => {
  const getRequest = () => {
    let request = new messages.SetWebcacheConfRequest();
    let config = new messages.WebcacheConfig();
    config.setAllowedSubnetList(props.allowedSubnetList);
    config.setSslServerList(props.sslServerList);
    config.setBlacklistUrlList(props.blacklistUrlList);
    config.setBlacklistIpList(props.blacklistIpList);
    config.setBlacklistRegexpList(props.blacklistRegexpList);
    config.setDiskSize(props.diskSize);
    config.setMemorySize(props.memorySize);
    config.setMinObject(props.minObject);
    config.setMaxObject(props.maxObject);
    config.setMaxObjectRam(props.maxObjectRam);
    request.setConfig(config);
    return request;
  };
  const formatData = (data) => {
    return data.hasError() ? data.toObject() : data.toObject().config ;
  };
  return setupRpcMethodPromise(id, "rpcSetWebcacheConfig", getRequest, formatData);
};

const rpcGetTcpxRules = (call) => {
  setupRpcCall(call, "rpcGetTcpxRules");
};

const getTcpxRules = (id, kind) => {
  const getRequest = () => {
    let request = new messages.GetTcpxRulesRequest();
    return request;
  };
  const formatData = (data) => {
    return data.hasError() ? data.toObject() : data.toObject().rulesList;
  };
  return setupRpcMethodPromise(id, "rpcGetTcpxRules", getRequest, formatData);
};

const rpcAddTcpxRule = (call) => {
  setupRpcCall(call, "rpcAddTcpxRule");
};

const addTcpxRule = (id, rule) => {
  const getRequest = () => {
    let request = new messages.AddTcpxRuleRequest();
    request.setSource(rule.source);
    request.setDestination(rule.destination);
    request.setPort(rule.port);
    request.setAcceleration(rule.acceleration);
    return request;
  };
  const formatData = (data) => {
    return data.hasError() ? data.toObject() : {ruleId: data.getRuleId()};
  };
  return setupRpcMethodPromise(id, "rpcAddTcpxRule", getRequest, formatData);
};

const rpcUpdateTcpxRule = (call) => {
  setupRpcCall(call, "rpcUpdateTcpxRule");
};

const updateTcpxRule = (id, ruleId, ruleProps) => {
  const getRequest = () => {
    let request = new messages.UpdateTcpxRuleRequest();
    let rule = new messages.TcpxRule();
    rule.setRuleId(ruleId);
    rule.setSource(ruleProps.source);
    rule.setDestination(ruleProps.destination);
    rule.setPort(ruleProps.port);
    rule.setAcceleration(ruleProps.acceleration);
    request.setRule(rule);
    return request;
  };
  const formatData = (data) => {
    return data.hasError() ? data.toObject() : {status: 'ok'};
  };
  return setupRpcMethodPromise(id, "rpcUpdateTcpxRule", getRequest, formatData);
};

const rpcRemoveTcpxRule = (call) => {
  setupRpcCall(call, "rpcRemoveTcpxRule");
};

const removeTcpxRule = (id, ruleId) => {
  const getRequest = () => {
    let request = new messages.RemoveTcpxRuleRequest();
    request.setRuleId(ruleId);
    return request;
  };
  const formatData = (data) => {
    return data.hasError() ? data.toObject() : {status: 'ok'};
  };
  return setupRpcMethodPromise(id, "rpcRemoveTcpxRule", getRequest, formatData);
};

const rpcMoveTcpxRule = (call) => {
  setupRpcCall(call, "rpcMoveTcpxRule");
};

const moveTcpxRule = (id, ruleId, upward) => {
  const getRequest = () => {
    let request = new messages.MoveTcpxRuleRequest();
    request.setRuleId(ruleId);
    request.setUpward(upward == 1);
    return request;
  };
  const formatData = (data) => {
    return data.hasError() ? data.toObject() : {status: 'ok'};
  };
  return setupRpcMethodPromise(id, "rpcMoveTcpxRule", getRequest, formatData);
};

const rpcResetService = (call) => {
  setupRpcCall(call, "rpcResetService");
};

const resetService = (id, kind) => {
  const getRequest = () => {
    let request = new messages.ServiceResetRequest();
    request.setKind(kind);
    return request;
  };
  const formatData = (data) => {
    return data.hasError() ? data.toObject() : { message: data.getMessage() } ;
  };
  return setupRpcMethodPromise(id, "rpcResetService", getRequest, formatData);
};

const rpcChangeSshPassword = (call) => {
  setupRpcCall(call, "rpcChangeSshPassword");
};

const changeSshPassword = (id, password) => {
  const getRequest = () => {
    let request = new messages.SshPasswordChangeRequest();
    request.setPassword(password);
    return request;
  };
  const formatData = (data) => {
    return data.hasError() ? data.toObject() : { message: data.getMessage() } ;
  };
  return setupRpcMethodPromise(id, "rpcChangeSshPassword", getRequest, formatData);
};

const parseTrafficPolicy = (trafficPolicy) => {
  let policy = new messages.TrafficPolicy();
  policy.setRuleId(trafficPolicy.ruleId);

  let match = new messages.TrafficPolicyMatch();
  match.setSource(trafficPolicy.match.source);
  match.setDestination(trafficPolicy.match.destination);
  match.setType(trafficPolicy.match.type);
  match.setKind(trafficPolicy.match.kind);
  match.setApplicationList(trafficPolicy.match.applicationList);
  match.setDscpList(trafficPolicy.match.dscpList);
  match.setProtocolValue(trafficPolicy.match.protocolValue);
  policy.setMatch(match);

  let action = new messages.TrafficPolicyAction();
  action.setDeny(trafficPolicy.action.deny);
  action.setDscp(trafficPolicy.action.dscp);
  action.setGroup(trafficPolicy.action.group);
  action.setQos(trafficPolicy.action.qos);
  action.setRate(trafficPolicy.action.rate);
  action.setGateway(trafficPolicy.action.gateway);
  action.setBypass(trafficPolicy.action.bypass);
  policy.setAction(action);

  return policy;
};

module.exports = {
  rpcGetSystemSettings,
  getSystemSettings,
  rpcUpdateSystemSettings,
  updateSystemSettings,
  rpcGetNetworkSettings,
  getNetworkSettings,
  rpcUpdateNetworkSettings,
  updateNetworkSettings,
  rpcGetOptimizationSettings,
  getOptimizationSettings,
  rpcUpdateOptimizationSettings,
  updateOptimizationSettings,
  rpcGetMonitorSettings,
  getMonitorSettings,
  rpcUpdateMonitorSettings,
  updateMonitorSettings,
  rpcGetTunnelPolicies,
  getTunnelPolicies,
  rpcDeleteTunnelPoliciesRule,
  deleteTunnelPoliciesRule,
  rpcUpdateTunnelPoliciesRule,
  updateTunnelPoliciesRule,
  rpcAddTunnelPoliciesRule,
  addTunnelPoliciesRule,
  rpcGetTrafficPolicies,
  getTrafficPolicies,
  rpcDeleteTrafficPolicy,
  deleteTrafficPolicy,
  rpcUpdateTrafficPolicy,
  updateTrafficPolicy,
  rpcAddTrafficPolicy,
  addTrafficPolicy,
  rpcGetRoutes,
  getRoutes,
  rpcAddRoute,
  addRoute,
  rpcUpdateRoute,
  updateRoute,
  rpcRemoveRoute,
  removeRoute,
  rpcGetWebcacheConfig,
  getWebcacheConfig,
  rpcSetWebcacheConfig,
  setWebcacheConfig,
  rpcGetTcpxRules,
  getTcpxRules,
  rpcAddTcpxRule,
  addTcpxRule,
  rpcUpdateTcpxRule,
  updateTcpxRule,
  rpcRemoveTcpxRule,
  removeTcpxRule,
  rpcMoveTcpxRule,
  moveTcpxRule,
  rpcGetPathConfig,
  getPathConfig,
  rpcSetPathConfig,
  setPathConfig,
  rpcGetPathGateways,
  getPathGateways,
  rpcRemovePathGateway,
  removePathGateway,
  rpcResetService,
  resetService,
  rpcChangeSshPassword,
  changeSshPassword
};