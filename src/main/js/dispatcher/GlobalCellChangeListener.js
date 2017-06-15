import Dispatcher from "./Dispatcher";
import {ActionTypes} from "../constants/TableauxConstants";
import * as f from "lodash/fp";

const providers = new Map();

const listenForCellChange = (subscriberId, interestedIn, callback) => {
  if (!providers.get(interestedIn)) {
    providers.set(interestedIn, new Map());
  }
  providers.get(interestedIn)
           .set(subscriberId, callback);
};

const clearCallbacks = (subscriberId) => {
  providers.forEach(
    function (subscribers) {
      subscribers.delete(subscriberId);
    }
  );
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

Dispatcher.on(ActionTypes.BROADCAST_DATA_CHANGE, triggerCallbacks);

export {listenForCellChange, clearCallbacks};
