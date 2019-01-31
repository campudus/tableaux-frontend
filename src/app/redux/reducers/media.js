import f from "lodash/fp";
import actionTypes from "../actionTypes";

const {
  MEDIA_FOLDER_LOADING,
  MEDIA_FOLDER_LOADED,
  MEDIA_FOLDER_ERROR,
  MEDIA_FOLDER_CREATE,
  MEDIA_FOLDER_CREATE_SUCCESS,
  MEDIA_FOLDER_CREATE_ERROR,
  MEDIA_FOLDER_EDIT,
  MEDIA_FOLDER_EDIT_SUCCESS,
  MEDIA_FOLDER_EDIT_ERROR,
  MEDIA_FOLDER_DELETE,
  MEDIA_FOLDER_DELETE_SUCCESS,
  MEDIA_FOLDER_DELETE_ERROR,

  MEDIA_FILE_GET,
  MEDIA_FILE_GET_SUCCESS,
  MEDIA_FILE_GET_ERROR,
  MEDIA_FILE_EDIT,
  MEDIA_FILE_EDIT_SUCCESS,
  MEDIA_FILE_EDIT_ERROR,
  MEDIA_FILE_DELETE,
  MEDIA_FILE_DELETE_SUCCESS,
  MEDIA_FILE_DELETE_ERROR
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
    case MEDIA_FOLDER_CREATE:
    case MEDIA_FOLDER_EDIT:
    case MEDIA_FOLDER_DELETE:
    case MEDIA_FILE_GET:
    case MEDIA_FILE_EDIT:
    case MEDIA_FILE_DELETE:
      return { ...state, error: false, finishedLoading: false };
    case MEDIA_FOLDER_ERROR:
    case MEDIA_FOLDER_CREATE_ERROR:
    case MEDIA_FOLDER_EDIT_ERROR:
    case MEDIA_FOLDER_DELETE_ERROR:
    case MEDIA_FILE_GET_ERROR:
    case MEDIA_FILE_EDIT_ERROR:
    case MEDIA_FILE_DELETE_ERROR:
      return { ...state, error: true, finishedLoading: true };
    case MEDIA_FOLDER_LOADED:
      return {
        ...state,
        error: false,
        finishedLoading: true,
        data: action.result
      };
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
    case MEDIA_FOLDER_EDIT_SUCCESS:
      return {
        ...state,
        error: false,
        finishedLoading: true,
        data:
          typeof action.result === "object"
            ? {
                ...state.data,
                subfolders: f.compose(
                  f.orderBy(subfolder => f.toLower(subfolder.name), ["asc"]),
                  f.concat(action.result),
                  f.remove(subfolder => subfolder.id === action.result.id)
                )(state.data.subfolders)
              }
            : state.data
      };
    case MEDIA_FOLDER_DELETE_SUCCESS:
      return {
        ...state,
        error: false,
        finishedLoading: true,
        data:
          typeof action.result === "object"
            ? {
                ...state.data,
                subfolders: f.remove(
                  subfolder => subfolder.id === action.result.id
                )(state.data.subfolders)
              }
            : state.data
      };
    case MEDIA_FILE_GET_SUCCESS:
    case MEDIA_FILE_EDIT_SUCCESS:
      return {
        ...state,
        error: false,
        finishedLoading: true,
        data:
          typeof action.result === "object"
            ? {
                ...state.data,
                files: f.compose(
                  f.orderBy(file => f.toLower(file.updatedAt), ["desc"]),
                  f.concat(action.result),
                  f.remove(file => file.uuid === action.result.uuid)
                )(state.data.files)
              }
            : state.data
      };
    case MEDIA_FILE_DELETE_SUCCESS:
      return {
        ...state,
        error: false,
        finishedLoading: true,
        data:
          typeof action.result === "object"
            ? {
                ...state.data,
                files: f.remove(file => file.uuid === action.result.uuid)(
                  state.data.files
                )
              }
            : state.data
      };
    default:
      return state;
  }
};

export default mediaReducer;
