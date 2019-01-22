import actionTypes from "../actionTypes";

const {
  MEDIA_FOLDER_LOADING,
  MEDIA_FOLDER_LOADED,
  MEDIA_FOLDER_ERROR
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
    default:
      return state;
  }
};

export default mediaReducer;
