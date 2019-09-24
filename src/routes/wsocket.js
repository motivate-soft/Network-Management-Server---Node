const WebSocket = require("ws");
const wHubEventManager = require("../whub-server/whub-server").eventManager;
const wHubEvents = require("../whub-server/whub-server").wHubEvents;

class WSocket {
  constructor() {
    this.wss = null;
  }

  start(options) {
    this.wss = new WebSocket.Server(options);
    this.wss.on("connection", () => {
    });

    wHubEventManager.on(wHubEvents.ONLINE_DEVICES_UPDATED, () => {
      this.broadcast(wHubEvents.ONLINE_DEVICES_UPDATED);
    });
  }

  broadcast(data) {
    this.wss.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  }
}

const instance = new WSocket();

module.exports.wsocket = instance;