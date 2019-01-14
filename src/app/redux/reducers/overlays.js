import f from "lodash/fp";
import actionTypes from "../actionTypes";

const {
  OPEN_OVERLAY,
  CLOSE_OVERLAY,
  SHOW_TOAST,
  HIDE_TOAST
} = actionTypes.overlays;

const initialState = {
  toast: null,
  overlays: []
};

export default (overlays = initialState, action) => {
  const { type } = action;
  switch (type) {
    case SHOW_TOAST: {
      const payload = f.pick(["content", "duration"], action);
      return f.assoc("toast", payload, overlays);
    }
    case HIDE_TOAST:
      return f.assoc("toast", null, overlays);
    case OPEN_OVERLAY:
    case CLOSE_OVERLAY:
    default:
      return overlays;
  }
};
