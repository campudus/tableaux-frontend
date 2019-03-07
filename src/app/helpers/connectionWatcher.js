// Importing this file will start the watcher when in production mode

import { Subject } from "rxjs";
import { bufferCount } from "rxjs/operators";
import { makeRequest } from "./apiHelper";
import Moment from "moment";
import store from "../redux/store";
import actions from "../redux/actionCreators";
import { showDialog } from "../components/overlay/GenericOverlay";
import i18n from "i18next";

const LOST_DIALOG_NAME = "connection-lost-dialog";
const RECONNECTED_DIALOG_NAME = "reconnected-dialog";
const AVG_PING_DELAY = 20; // s

const connectionStatus = new Subject();

const getPingDelay = connected =>
  connected
    ? AVG_PING_DELAY * 0.75 + AVG_PING_DELAY * Math.random() * 500
    : AVG_PING_DELAY * 500;

const pingDelayed = delay =>
  window.setTimeout(async () => {
    const connected = await makeRequest({ apiRoute: "/system/versions" })
      .then(() => true)
      .catch(() => false);
    connectionStatus.next({ connected, time: new Moment() });
    pingDelayed(getPingDelay(connected));
  }, delay);

connectionStatus
  .pipe(bufferCount(2, 1))
  .subscribe(([statusBefore, statusNow]) => {
    // No need to act if nothing changed
    if (statusBefore.connected === statusNow.connected) {
      return;
    }

    const { connected } = statusNow;

    // Close any that might be open
    store.dispatch(actions.closeOverlay(LOST_DIALOG_NAME));
    store.dispatch(actions.closeOverlay(RECONNECTED_DIALOG_NAME));
    store.dispatch(
      actions.setStatusInfo({ key: "connectedToBackend", value: connected })
    );

    showDialog({
      name: connected ? RECONNECTED_DIALOG_NAME : LOST_DIALOG_NAME,
      type: connected ? "important" : "warning",
      context: i18n.t("common:connection.status"),
      title: i18n.t(
        connected
          ? "common:connection.reconnected-title"
          : "common:connection.disconnected-title"
      ),
      message: i18n.t(
        connected
          ? "common:connection.reconnected-message"
          : "common:connection.disconnected-message",
        { time: statusBefore.time.toString() }
      ),
      buttonActions: {
        [connected ? "positive" : "negative"]: [i18n.t("common:ok"), () => null]
      }
    });
  });

if (process.env.NODE_ENV === "production") {
  connectionStatus.next({
    connected: true,
    time: new Moment()
  });
  pingDelayed(getPingDelay("assumeConnected"));
  console.log(`Keepalive ping every ~${AVG_PING_DELAY}s`);
}
