import Dispatcher from "./Dispatcher";
import {ActionTypes} from "../constants/TableauxConstants";
import * as f from "lodash/fp";

const providers = new Map();
const knownSubscribers = new Set();

const listenForCellChange = (subscriberId, interestedIn, callback) => {
  if (!providers.get(interestedIn)) {
    providers.set(interestedIn, new Map());
  }
  providers.get(interestedIn)
    .set(subscriberId, callback);
  knownSubscribers.add(subscriberId);
};

const clearCallbacks = (subscriberId, keepSubscriber) => {
  if (!knownSubscribers.has(subscriberId)) {
    return;
  }
  providers.forEach(
    function (subscribers) {
      subscribers.delete(subscriberId);
    }
  );
  // only delete subscriber if we don't want to immediately resubscribe
  if (!keepSubscriber) {
    knownSubscribers.delete(subscriberId);
  }
};

const triggerCallbacks = (payload) => {
  const cellKey = f.get(["cell", "id"], payload);
  const subscribers = providers.get(cellKey) || [];
  let badKeys = [];

  subscribers.forEach(
    function (fn, mapKey) {
      if (fn) {
        try {
          fn(payload);
        } catch (e) {
          console.error(e);
          badKeys.push(mapKey);
        }
      } else {
        badKeys.push(mapKey);
      }
    }
  );

  badKeys.forEach(
    function (badKey) {
      providers.delete(badKey);
    }
  );
};

Dispatcher.on("all", (...args) => {
  // window.devLog("An event was triggered:", ...args);
  const [name, ...rest] = args;
  if (name === ActionTypes.BROADCAST_DATA_CHANGE) {
    triggerCallbacks(...rest);
  }
});
// https://app.activecollab.com/116706/projects/2/tasks/2843
// Dispatcher.on(ActionTypes.BROADCAST_DATA_CHANGE, triggerCallbacks);

export {listenForCellChange, clearCallbacks};
