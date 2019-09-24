const express = require("express");
const router = express.Router({ mergeParams: true });
const auth = require("../services/auth");
const grpcServer = require("../whub-server/whub-server");
const deviceRepo = require("../services/device-repo");
const { authorize } = require("../services/auth");

// Setup authorization middleware
router.use(authorize());

const STOP_POLLING_DELTA_MS = 5000;
const DEFAULT_POLLING_INTERVAL_MS = 5000;
const state = {
  minIntervalMs: 0,
  maxIntervalMs: 0,
  stopPollingTimer: null
};

function stopPolling() {
  // Stop gRPC stats polling
  clearTimeout(state.stopPollingTimer);
  state.stopPollingTimer = null;
  state.minIntervalMs = 0;
  state.maxIntervalMs = 0;
  grpcServer.stopPollStats();
}

function getIntervalMs(intervalSec) {
  if (intervalSec) {
    let number = Number(intervalSec);
    if (!isNaN(number)) {
      return number * 1000;
    }
  }
  return DEFAULT_POLLING_INTERVAL_MS;
}

function updateState(interval) {
  let minChanged = false;
  if (!state.minIntervalMs || interval < state.minIntervalMs) {
    state.minIntervalMs = interval;
    minChanged = true;
  }
  if (!state.maxIntervalMs || interval > state.maxIntervalMs) {
    state.maxIntervalMs = interval;
  }

  if (minChanged) {
    // Update gRPC stats polling
    grpcServer.startPollStats(state.minIntervalMs);
  }
  if (state.stopPollingTimer) {
    clearTimeout(state.stopPollingTimer);
    state.stopPollingTimer = null;
  }
  state.stopPollingTimer = setTimeout(stopPolling, state.maxIntervalMs + STOP_POLLING_DELTA_MS);
}

router.get("/", authorize(), async (req, res, next) => {
  try {
    updateState(getIntervalMs(req.query.interval));
    let devicesStats = await deviceRepo.getDevicesStatsForOrg(req.params.orgId);
    res.json(devicesStats);
  } catch (err) {
    next(err);
  }
});

module.exports = router;