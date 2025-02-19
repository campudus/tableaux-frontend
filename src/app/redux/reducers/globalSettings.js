import ActionTypes from "../actionTypes";

const { SET_GLOBAL_SETTINGS } = ActionTypes;

export const GLOBAL_SETTING = {
  FILTER_RESET: "filterReset",
  COLUMNS_RESET: "columnsReset",
  SORTING_RESET: "sortingReset",
  SORTING_DESC: "sortingDesc",
  ANNOTATION_RESET: "annotationReset"
};

export const GLOBAL_SETTINGS_DEFAULT = {
  [GLOBAL_SETTING.FILTER_RESET]: false,
  [GLOBAL_SETTING.COLUMNS_RESET]: false,
  [GLOBAL_SETTING.SORTING_RESET]: false,
  [GLOBAL_SETTING.SORTING_DESC]: false,
  [GLOBAL_SETTING.ANNOTATION_RESET]: false
};

export default (state = GLOBAL_SETTINGS_DEFAULT, action) => {
  switch (action.type) {
    case SET_GLOBAL_SETTINGS: {
      const { settings } = action;

      return { ...state, ...settings };
    }
    default:
      return state;
  }
};
