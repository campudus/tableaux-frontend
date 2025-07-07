import actionTypes from "../actionTypes";

const { SET_PREVIEW_VIEW } = actionTypes;

const initialState = {};

type PreviewAction = {
  type: string;
  currentTable: number | null;
  currentColumn: number | null;
  currentRow: number | null;
};

const previewReducer = (state = initialState, action: PreviewAction) => {
  const { type } = action;

  switch (type) {
    case SET_PREVIEW_VIEW:
      return {
        ...state,
        currentTable: action.currentTable || null,
        currentColumn: action.currentColumn || null,
        currentRow: action.currentRow || null
      };
    default:
      return state;
  }
};

export default previewReducer;
