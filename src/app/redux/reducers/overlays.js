import f from "lodash/fp";
import actionTypes from "../actionTypes";
import { doto, when } from "../../helpers/functools";

const {
  OPEN_OVERLAY,
  CLOSE_OVERLAY,
  REMOVE_OVERLAY,
  SET_OVERLAY_STATE,
  SHOW_TOAST,
  HIDE_TOAST
} = actionTypes.overlays;

const initialState = {
  toast: null,
  overlays: [],
  exitingOverlays: []
};

const openOverlay = (state, action) => {
  const content = action.payload;
  const timestamp = new Date().getTime();
  const namedContent = doto(
    content,
    when(cont => f.isEmpty(cont.name), f.assoc("name", timestamp)),
    f.assoc("id", timestamp)
  );

  return doto(state, f.update("overlays", f.concat(f.__, namedContent)));
};

const removeOverlay = (state, action) => {
  const { overlayId } = action;
  return f.update("overlays", f.reject(f.propEq("id", overlayId)), state);
};

const closeOverlay = (state, action) => {
  const { overlayId } = action;
  return f.update(
    "overlays",
    f.map(when(f.propEq("id", overlayId), f.assoc("exiting", true))),
    state
  );
};

const setOverlayState = (state, action) => {
  const id = f.prop("id", action);
  if (f.isEmpty(id) && !f.isInteger(id)) {
    console.log("  -- id:", typeof id, id);
    console.warn("Trying to set overlay to", action, "but no id was given");
    return state;
  }

  // make sure we don't accidently trash the overlay
  const overlayState = f.omit(["id", "head", "body", "foot", "type"], action);
  const overlayIdx = f.findIndex(f.propEq("id", id), state.overlays);
  return f.update(["overlays", overlayIdx], f.merge(f.__, overlayState), state);
};

const isObjectOrString = v => f.anyPass([f.isObject, f.isString])(v);
const isOptionalObjectOrString = v => f.anyPass([f.isNil, isObjectOrString])(v);
const isOptionalString = v => f.anyPass([f.isNil, f.isString])(v);

export const overlayParamsSpec = {
  head: isObjectOrString,
  body: isObjectOrString,
  foot: isOptionalObjectOrString,
  name: isOptionalString
};

export default (state = initialState, action) => {
  const { type } = action;
  switch (type) {
    case SHOW_TOAST: {
      const payload = f.pick(["content", "duration"], action);
      return f.assoc("toast", payload, state);
    }
    case HIDE_TOAST:
      return f.assoc("toast", null, state);
    case OPEN_OVERLAY:
      return openOverlay(state, action);
    case CLOSE_OVERLAY:
      return closeOverlay(state, action);
    case REMOVE_OVERLAY:
      return removeOverlay(state, action);
    case SET_OVERLAY_STATE:
      return setOverlayState(state, action);
    default:
      return state;
  }
};
