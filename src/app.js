let express = require("express");
let path = require("path");
let morgan = require("morgan");
var history = require("connect-history-api-fallback");
let config = require("./config/config.json");
let grpcServer = require("./whub-server/whub-server");
let { Db } = require("./services/db");
let { ApiError, NotFoundApiError, UnknownApiError, UnauthenticatedApiError, handleApiError } = require("./services/errors");
const { BackupScheduler } = require("./services/backup-scheduler");

let app = express();

// Cookie Session setting
require("./services/cookieSession")(app);

// Routers - Organization/Global level
let orgsRouter = require("./routes/orgs");
let usersRouter = require("./routes/users");
let devicesRouter = require("./routes/devices");
let orgDevicesRouter = require("./routes/orgDevices");
let statsRouter = require("./routes/stats");
let bootstrapRouter = require("./routes/bootstrap");

// Routers - Device level
let deviceDashboardRouter = require("./routes/device/dashboard");
let deviceWebcacheRouter = require("./routes/device/webcache");
let deviceNetworkRouter = require("./routes/device/network");
let deviceSystemRouter = require("./routes/device/system");
let deviceDiagnosticRouter = require("./routes/device/diagnostic");
let deviceConfigureRouter = require("./routes/device/configure");
let deviceAlertRouter = require("./routes/device/alert");
let deviceMaintenanceRouter = require("./routes/device/maintenance");
let deviceLicenseRouter = require("./routes/device/license");
let systemRouter = require("./routes/system");

let db = new Db(config.mongoUrl, config.dbName);

async function init() {
  let dbDefaults = await db.initialize(config.mongoReconnectDelay);
  await grpcServer.start(config.rpcIp, config.rpcPort, dbDefaults.defaultOrgId);
  let backupScheduler = new BackupScheduler(config.backupRetension);
  backupScheduler.initialize();
}
init();



const historyMiddleware = history();
app.use((req, res, next) => {
  // Skip /api routers
  if (req.path.startsWith("/api")) {
    next();
  } else {
    historyMiddleware(req, res, next);
  }
});

app.use(morgan("dev", {
  skip: function(req, res) { return res.statusCode < 400; }
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "../public")));

app.use("/api/users", usersRouter);
app.use("/api/orgs", orgsRouter);
app.use("/api/devices", devicesRouter);
app.use("/api/bootstrap", bootstrapRouter);
app.use("/api/system/", systemRouter);
app.use("/api/:orgId/devices", orgDevicesRouter);
app.use("/api/:orgId/stats", statsRouter);
app.use("/api/:orgId/device/:deviceId/dashboard", deviceDashboardRouter);
app.use("/api/:orgId/device/:deviceId/webcache", deviceWebcacheRouter);
app.use("/api/:orgId/device/:deviceId/network", deviceNetworkRouter);
app.use("/api/:orgId/device/:deviceId/system", deviceSystemRouter);
app.use("/api/:orgId/device/:deviceId/diagnostic", deviceDiagnosticRouter);
app.use("/api/:orgId/device/:deviceId/configure", deviceConfigureRouter);
app.use("/api/:orgId/device/:deviceId/alert", deviceAlertRouter);
app.use("/api/:orgId/device/:deviceId/maintenance", deviceMaintenanceRouter);
app.use("/api/:orgId/device/:deviceId/license", deviceLicenseRouter);

global.prjPath  = path.resolve(__dirname);
global.WCM_SCRIPT_PATH = path.join(prjPath, 'wcm_script.sh');

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(new NotFoundApiError());
});

// error handler
// eslint-disable-next-line no-unused-vars
app.use(function(err, req, res, next) {
  //let detailedError = req.app.get("env") === "development" ? err : {};

  // If err is already an ApiError then just forward to api error handler.
  if (err instanceof ApiError) {
    return handleApiError(res, err);
  }

  if (typeof(err) === "string") {
    return handleApiError(res, new UnknownApiError(err));
  }

  if (err.name === "UnauthorizedError") {
    // jwt authentication error
    return handleApiError(res, new UnauthenticatedApiError());
  }

  // default to 500 server error
  return handleApiError(res, new UnknownApiError(err.message));
});

module.exports = app;