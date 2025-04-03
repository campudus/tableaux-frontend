import { Attachment, Folder } from "../../types/grud";
import { makeRequest } from "../../helpers/apiHelper";
import { toFolder, toFile } from "../../helpers/apiRoutes";
import actionTypes from "../actionTypes";

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

export const getMediaFolder = (
  folderId?: string | number,
  langtag?: string
) => {
  return {
    promise: makeRequest({
      apiRoute: toFolder(folderId, langtag),
      method: "GET"
    }),
    actionTypes: [
      MEDIA_FOLDER_GET,
      MEDIA_FOLDER_GET_SUCCESS,
      MEDIA_FOLDER_GET_ERROR
    ],
    folderId: folderId || "root-folder"
  };
};

export const createMediaFolder = (
  data: Pick<Folder, "name"> & Partial<Pick<Folder, "description" | "parent">>
) => {
  return {
    promise: makeRequest({
      apiRoute: toFolder(),
      data: data,
      method: "POST"
    }),
    actionTypes: [
      MEDIA_FOLDER_CREATE,
      MEDIA_FOLDER_CREATE_SUCCESS,
      MEDIA_FOLDER_CREATE_ERROR
    ]
  };
};

export const editMediaFolder = (
  folderId: string | number,
  data: Partial<Pick<Folder, "name" | "description" | "parent">>
) => {
  return {
    promise: makeRequest({
      apiRoute: toFolder(folderId),
      data: data,
      method: "PUT"
    }),
    actionTypes: [
      MEDIA_FOLDER_EDIT,
      MEDIA_FOLDER_EDIT_SUCCESS,
      MEDIA_FOLDER_EDIT_ERROR
    ]
  };
};

export const deleteMediaFolder = (folderId: string | number) => {
  return {
    promise: makeRequest({
      apiRoute: toFolder(folderId),
      method: "DELETE"
    }),
    actionTypes: [
      MEDIA_FOLDER_DELETE,
      MEDIA_FOLDER_DELETE_SUCCESS,
      MEDIA_FOLDER_DELETE_ERROR
    ]
  };
};

export const getMediaFile = (fileId?: string | number, langtag?: string) => {
  return {
    promise: makeRequest({
      apiRoute: toFile(fileId, langtag),
      method: "GET"
    }),
    actionTypes: [MEDIA_FILE_GET, MEDIA_FILE_GET_SUCCESS, MEDIA_FILE_GET_ERROR]
  };
};

export const editMediaFile = (
  fileId: string | number,
  data: Partial<
    Pick<
      Attachment,
      | "title"
      | "description"
      | "externalName"
      | "internalName"
      | "mimeType"
      | "folder"
    >
  >
) => {
  return {
    promise: makeRequest({
      apiRoute: toFile(fileId),
      data: data,
      method: "PUT"
    }),
    actionTypes: [
      MEDIA_FILE_EDIT,
      MEDIA_FILE_EDIT_SUCCESS,
      MEDIA_FILE_EDIT_ERROR
    ]
  };
};

export const deleteMediaFile = (fileId: string | number) => {
  return {
    promise: makeRequest({
      apiRoute: toFile(fileId),
      method: "DELETE"
    }),
    actionTypes: [
      MEDIA_FILE_DELETE,
      MEDIA_FILE_DELETE_SUCCESS,
      MEDIA_FILE_DELETE_ERROR
    ]
  };
};
