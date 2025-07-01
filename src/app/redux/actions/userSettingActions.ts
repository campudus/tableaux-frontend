import { makeRequest } from "../../helpers/apiHelper";
import { toUserSettings } from "../../helpers/apiRoutes";
import actionTypes from "../actionTypes";
import {
  UserSettingBody,
  UserSettingKey,
  UserSettingKind,
  UserSettingParams
} from "../../types/userSettings";

const {
  USER_SETTINGS_GET,
  USER_SETTINGS_GET_SUCCESS,
  USER_SETTINGS_GET_ERROR,
  USER_SETTING_UPSERT,
  USER_SETTING_UPSERT_SUCCESS,
  USER_SETTING_UPSERT_ERROR
} = actionTypes.userSettings;

export const getUserSettings = <Kind extends UserSettingKind>(
  params: UserSettingParams<Kind>
) => {
  return {
    promise: makeRequest({
      apiRoute: toUserSettings(params),
      method: "GET"
    }),
    actionTypes: [
      USER_SETTINGS_GET,
      USER_SETTINGS_GET_SUCCESS,
      USER_SETTINGS_GET_ERROR
    ]
  };
};

export const upsertUserSetting = <
  Kind extends UserSettingKind,
  Key extends UserSettingKey
>(
  params: UserSettingParams<Kind>,
  body: UserSettingBody<Kind, Key>
) => {
  return {
    promise: makeRequest({
      method: "PUT",
      apiRoute: toUserSettings(params),
      data: body
    }),
    actionTypes: [
      USER_SETTING_UPSERT,
      USER_SETTING_UPSERT_SUCCESS,
      USER_SETTING_UPSERT_ERROR
    ],
    params,
    body
  };
};
