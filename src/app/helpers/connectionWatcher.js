// Importing this file will start the watcher when in production mode

import { Subject } from "rxjs";
import { bufferCount } from "rxjs/operators";
import Moment from "moment";
import i18n from "i18next";

import { formatDateTime } from "./multiLanguage";
import { makeRequest } from "./apiHelper";
import { showDialog } from "../components/overlay/GenericOverlay";
import actions from "../redux/actionCreators";
import store from "../redux/store";

const LOST_DIALOG_NAME = "connection-lost-dialog";
const RECONNECTED_DIALOG_NAME = "reconnected-dialog";
const AVG_PING_DELAY = 20; // s
const ERROR_PING_DELAY = 1000; // ms

const connectionStatus = new Subject();

const getPingDelay = connected =>
  connected
    ? AVG_PING_DELAY * 0.75 + AVG_PING_DELAY * Math.random() * 500
    : AVG_PING_DELAY * 500;

const pingDelayed = (delay, connectedBefore = false) =>
  window.setTimeout(async () => {
    const connected = await makeRequest({ apiRoute: "/system/versions" })
      .then(() => true)
      .catch(() => false);

    // Don't immediately report loss of connection, but wait half a
    // second, in case we just ran into a race condition with token
    // refresh
    const shouldReportConnectionStatus = connected || !connectedBefore;

    if (shouldReportConnectionStatus) {
      connectionStatus.next({ connected, time: new Moment() });
    }
    pingDelayed(
      shouldReportConnectionStatus ? getPingDelay(connected) : ERROR_PING_DELAY,
      connected
    );
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
        { time: formatDateTime(statusBefore.time) }
      ),
      buttonActions: {
        [connected ? "positive" : "negative"]: [i18n.t("common:ok"), () => null]
      }
    });
  });

if (import.meta.env.NODE_ENV === "production") {
  connectionStatus.next({
    connected: true,
    time: new Moment()
  });
  pingDelayed(getPingDelay("assumeConnected"));
  console.log(`Keepalive ping every ~${AVG_PING_DELAY}s`);
}
