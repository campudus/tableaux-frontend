import request from "superagent";
import apiUrl from "../helpers/apiUrl";
import ActionCreator from "../actions/ActionCreator";
import Moment from "moment";
import {showDialog} from "../components/overlay/GenericOverlay";

const PING_TIME = 10; // seconds

class ConnectionWatcher {
  static connected = true; // hope for the best
  static since = Moment();

  static watchConnection(connected) {
    if (connected !== ConnectionWatcher.connected) {
      ConnectionWatcher.announceConnectionChange(connected);
    }
    window.setTimeout(
      () => {
        ConnectionWatcher
          .ping()
          .then(ConnectionWatcher.watchConnection);
      },
      (connected) ? (PING_TIME * 0.5 + (PING_TIME * Math.random()) * 1000) : PING_TIME * 500);
  };

  static ping() {
    return new Promise(
      function (resolve, reject) {
        request
          .get(apiUrl("/system/versions"))
          .end(
            function (err, response) {
              if (err) {
                resolve(false);
              } else {
                resolve(true);
              }
            }
          );
      }
    );
  }

  static announceConnectionChange(newState) {
    ConnectionWatcher.connected = newState;
    const now = Moment();
    const lastSeen = now.subtract(PING_TIME, "seconds");
    console.warn(`Connection status changed to ${(newState) ? "connected" : "disconnected"} at ${((newState)
      ? now
      : lastSeen).toString()}`);
    showDialog({
      type: (newState) ? "important" : "warning",
      context: "Server connection",
      title: (newState) ? "Reconnected" : "Disconnected",
      heading: (newState) ? "Connection to server re-established" : "Connection to server lost",
      message: (newState)
        ? `You may now safely continue working`
        : `Modifications after ${lastSeen.toString()} could not be saved. Please check your network connection.`,
      actions: {
        [(newState) ? "positive" : "negative"]: [
          "Ok", function () {
          }
        ]
      }
    });
    ActionCreator.broadcastConnectionStatus({
      connected: newState,
      since: lastSeen
    });
    ConnectionWatcher.since = lastSeen;
  }
}

ConnectionWatcher.watchConnection(true); // auto-start when imported
console.log(`Keepalive ping every ${PING_TIME}s`);

export default ConnectionWatcher;
