import f from "lodash/fp";
import actionTypes from "../actionTypes";

const {
  MEDIA_FOLDER_LOADING,
  MEDIA_FOLDER_LOADED,
  MEDIA_FOLDER_ERROR,
  MEDIA_FOLDER_CREATE,
  MEDIA_FOLDER_CREATE_SUCCESS,
  MEDIA_FOLDER_CREATE_ERROR
} = actionTypes.media;

const initialState = {
  finishedLoading: false,
  error: false,
  data: {}
};

const mediaReducer = (state = initialState, action) => {
  const { type } = action;

  switch (type) {
    case MEDIA_FOLDER_LOADING:
      return { ...state, error: false, finishedLoading: false };
    case MEDIA_FOLDER_LOADED:
      return {
        ...state,
        error: false,
        finishedLoading: true,
        data: action.result
      };
    case MEDIA_FOLDER_ERROR:
      return { ...state, error: true, finishedLoading: true };
    case MEDIA_FOLDER_CREATE:
      return { ...state, error: false, finishedLoading: false };
    case MEDIA_FOLDER_CREATE_SUCCESS:
      return {
        ...state,
        error: !(typeof action.result === "object"),
        finishedLoading: true,
        data:
          typeof action.result === "object"
            ? {
                ...state.data,
                subfolders: f.compose(
                  f.orderBy(subfolder => f.toLower(subfolder.name), ["asc"]),
                  f.concat(action.result)
                )(state.data.subfolders)
              }
            : state.data
      };
    case MEDIA_FOLDER_CREATE_ERROR:
      return { ...state, error: true, finishedLoading: true };
    default:
      return state;
  }
};

export default mediaReducer;
