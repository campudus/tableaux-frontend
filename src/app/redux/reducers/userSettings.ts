import f from "lodash/fp";
import {
  UserSetting,
  UserSettingBody,
  UserSettingFilter,
  UserSettingGlobal,
  UserSettingKey,
  UserSettingKeyFilter,
  UserSettingKeyGlobal,
  UserSettingKeyTable,
  UserSettingKind,
  UserSettingParams,
  UserSettingTable,
  UserSettingValue
} from "../../types/userSettings";
import ActionTypes from "../actionTypes";
import { isUserSettingOfKind } from "../../types/guards";

const {
  USER_SETTINGS_GET_SUCCESS,
  USER_SETTING_UPSERT_SUCCESS,
  USER_SETTINGS_DELETE,
  USER_SETTINGS_DELETE_SUCCESS
} = ActionTypes.userSettings;

export type UserSettingsState = {
  global: {
    [Key in UserSettingKeyGlobal]: UserSettingValue<Key>;
  };
  table: {
    [tableId: number]: {
      [Key in UserSettingKeyTable]: UserSettingValue<Key>;
    };
  };
  filter: {
    [Key in UserSettingKeyFilter]: Array<Extract<UserSetting, { key: Key }>>;
  };
};

type UserSettingAction =
  | {
      type: typeof USER_SETTINGS_GET_SUCCESS;
      result: { settings: Array<UserSetting> };
      params: UserSettingParams<UserSettingKind>;
    }
  | {
      type: typeof USER_SETTING_UPSERT_SUCCESS;
      result: UserSetting;
      params: UserSettingParams<UserSettingKind>;
      body: UserSettingBody<UserSettingKind, UserSettingKey>;
    }
  | {
      type: typeof USER_SETTINGS_DELETE | typeof USER_SETTINGS_DELETE_SUCCESS;
      params: UserSettingParams<UserSettingKind>;
    };

export const initialState: UserSettingsState = {
  global: {
    annotationReset: false,
    columnsReset: false,
    filterReset: false,
    sortingDesc: false,
    sortingReset: false,
    markdownEditor: "DIRECT"
  },
  table: {},
  filter: {
    presetFilter: []
  }
};

export default (state = initialState, action: UserSettingAction) => {
  switch (action.type) {
    case USER_SETTING_UPSERT_SUCCESS: {
      const setting = action.result;

      if (setting.kind === "global") {
        const { kind, key, value } = setting;
        return f.assoc([kind, key], value, state);
      }

      if (setting.kind === "table") {
        const { kind, tableId, key, value } = setting;
        return f.assoc([kind, tableId, key], value, state);
      }

      if (setting.kind === "filter") {
        const { kind, key } = setting;
        return f.update([kind, key], settings => [...settings, setting], state);
      }

      return state;
    }
    case USER_SETTINGS_GET_SUCCESS: {
      const { settings } = action.result;

      return {
        ...state,
        global: {
          ...state.global,
          ...f.flow(
            f.filter<UserSetting>(s => isUserSettingOfKind(s, "global")),
            f.keyBy<UserSettingGlobal>(s => s.key),
            f.mapValues(s => s.value)
          )(settings)
        },
        table: {
          ...state.table,
          ...f.flow(
            f.filter<UserSetting>(s => isUserSettingOfKind(s, "table")),
            f.groupBy<UserSettingTable>(s => s.tableId),
            f.mapValues(
              f.flow(
                f.keyBy(s => s.key),
                f.mapValues(s => s.value)
              )
            )
          )(settings)
        },
        filter: {
          ...state.filter,
          ...f.flow(
            f.filter<UserSetting>(s => isUserSettingOfKind(s, "filter")),
            f.groupBy<UserSettingFilter>(s => s.key)
          )(settings)
        }
      };
    }
    case USER_SETTINGS_DELETE:
    case USER_SETTINGS_DELETE_SUCCESS: {
      const { params } = action;

      if (params.kind === "global") {
        return state;
      }

      if (params.kind === "table" && params.tableId) {
        return f.dissoc(
          f.compact([params.kind, params.tableId, params.key]),
          state
        );
      }

      if (params.kind === "filter" && params.id) {
        return f.update(
          [params.kind],
          f.flow(
            Object.entries,
            f.map(([settingKey, settingList]) => [
              settingKey,
              f.reject(f.propEq("id", params.id), settingList)
            ]),
            Object.fromEntries
          ),
          state
        );
      }

      return state;
    }
    default:
      return state;
  }
};
