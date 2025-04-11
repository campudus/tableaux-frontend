import f from "lodash/fp";
import actionTypes from "../actionTypes";
import { Attachment, Folder } from "../../types/grud";

const {
  MEDIA_FOLDER_GET,
  MEDIA_FOLDER_GET_SUCCESS,
  MEDIA_FOLDER_GET_ERROR,
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

export type MediaState = {
  finishedLoading: boolean;
  error: boolean;
  currentFolderId: string | Folder["id"] | null;
  data: Partial<Folder>;
};

type MediaAction = {
  type: string;
  folderId: Folder["id"];
  result: Partial<Folder> | Partial<Attachment>;
};

const initialState: MediaState = {
  finishedLoading: false,
  error: false,
  currentFolderId: null,
  data: {}
};

const mediaReducer = (state = initialState, action: MediaAction) => {
  const { type } = action;

  switch (type) {
    case MEDIA_FOLDER_GET:
      return {
        ...state,
        error: false,
        finishedLoading: false,
        currentFolderId: action.folderId || "root-folder"
      };
    case MEDIA_FOLDER_CREATE:
    case MEDIA_FOLDER_EDIT:
    case MEDIA_FOLDER_DELETE:
    case MEDIA_FILE_GET:
    case MEDIA_FILE_EDIT:
    case MEDIA_FILE_DELETE:
      return { ...state, error: false, finishedLoading: false };
    case MEDIA_FOLDER_GET_ERROR:
    case MEDIA_FOLDER_CREATE_ERROR:
    case MEDIA_FOLDER_EDIT_ERROR:
    case MEDIA_FOLDER_DELETE_ERROR:
    case MEDIA_FILE_GET_ERROR:
    case MEDIA_FILE_EDIT_ERROR:
    case MEDIA_FILE_DELETE_ERROR:
      return { ...state, error: true, finishedLoading: true };
    case MEDIA_FOLDER_GET_SUCCESS:
      return {
        ...state,
        error: false,
        finishedLoading: true,
        data: action.result as Partial<Folder>
      };
    case MEDIA_FOLDER_CREATE_SUCCESS: {
      const createdFolder = f.isPlainObject(action.result)
        ? (action.result as Folder)
        : null;

      return {
        ...state,
        error: !createdFolder,
        finishedLoading: true,
        data: createdFolder
          ? {
              ...state.data,
              subfolders: f.compose(
                f.orderBy(({ name }: Folder) => f.toLower(name), ["asc"]),
                f.concat(createdFolder)
              )(state.data.subfolders ?? [])
            }
          : state.data
      };
    }
    case MEDIA_FOLDER_EDIT_SUCCESS: {
      const editedFolder = f.isPlainObject(action.result)
        ? (action.result as Omit<Folder, "files" | "subfolders">)
        : null;

      return {
        ...state,
        error: false,
        finishedLoading: true,
        data: editedFolder
          ? {
              ...state.data,
              subfolders: f.compose(
                f.orderBy(({ name }: Folder) => f.toLower(name), ["asc"]),
                f.concat(editedFolder),
                f.remove(subfolder => subfolder.id === editedFolder.id)
              )(state.data.subfolders ?? [])
            }
          : state.data
      };
    }
    case MEDIA_FOLDER_DELETE_SUCCESS: {
      const deletedFolder = f.isPlainObject(action.result)
        ? (action.result as Pick<Folder, "id">)
        : null;

      return {
        ...state,
        error: false,
        finishedLoading: true,
        data: deletedFolder
          ? {
              ...state.data,
              subfolders: f.remove<Folder>(
                subfolder => subfolder.id === deletedFolder.id
              )(state.data.subfolders ?? [])
            }
          : state.data
      };
    }
    case MEDIA_FILE_GET_SUCCESS:
    case MEDIA_FILE_EDIT_SUCCESS: {
      const editedFile = f.isPlainObject(action.result)
        ? (action.result as Attachment)
        : null;

      return {
        ...state,
        error: false,
        finishedLoading: true,
        data: editedFile
          ? {
              ...state.data,
              files: f.compose(
                f.orderBy((file: Attachment) => f.toLower(file.updatedAt), [
                  "desc"
                ]),
                f.concat(editedFile),
                f.remove(file => file.uuid === editedFile.uuid)
              )(state.data.files ?? [])
            }
          : state.data
      };
    }
    case MEDIA_FILE_DELETE_SUCCESS: {
      const deletedFile = f.isPlainObject(action.result)
        ? (action.result as Pick<Attachment, "uuid">)
        : null;

      return {
        ...state,
        error: false,
        finishedLoading: true,
        data: deletedFile
          ? {
              ...state.data,
              files: f.remove<Attachment>(
                file => file.uuid === deletedFile.uuid
              )(state.data.files ?? [])
            }
          : state.data
      };
    }
    default:
      return state;
  }
};

export default mediaReducer;
