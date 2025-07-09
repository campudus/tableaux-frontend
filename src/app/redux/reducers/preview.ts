import actionTypes from "../actionTypes";

const {
  PREVIEW_SET_VIEW,
  PREVIEW_SET_CURRENT_COLUMN,
  PREVIEW_SET_CURRENT_DETAIL_TABLE
} = actionTypes.preview;

const initialState = {};

type PreviewAction = {
  type: string;
  currentTable: number | null;
  currentColumn: number | null;
  currentRow: number | null;
  currentDetailTable: number | null;
};

const previewReducer = (state = initialState, action: PreviewAction) => {
  const { type } = action;

  switch (type) {
    case PREVIEW_SET_VIEW:
      return {
        ...state,
        currentTable: action.currentTable || null,
        currentColumn: action.currentColumn || null,
        currentRow: action.currentRow || null
      };
    case PREVIEW_SET_CURRENT_COLUMN:
      return {
        ...state,
        currentColumn: action.currentColumn || null
      };
    case PREVIEW_SET_CURRENT_DETAIL_TABLE:
      return {
        ...state,
        currentDetailTable: action.currentDetailTable || null
      };
    default:
      return state;
  }
};

export default previewReducer;
