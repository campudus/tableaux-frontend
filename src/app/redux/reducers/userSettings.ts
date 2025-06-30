import f from "lodash/fp";
import {
  UserSetting,
  UserSettingFilter,
  UserSettingGlobal,
  UserSettingKeyFilter,
  UserSettingKeyGlobal,
  UserSettingKeyTable,
  UserSettingTable
} from "../../types/userSettings";
import ActionTypes from "../actionTypes";
import { isUserSettingOfKind } from "../../types/guards";

const { SET_USER_SETTINGS } = ActionTypes;

export type UserSettingsState = {
  global: {
    [Key in UserSettingKeyGlobal]: Extract<UserSetting, { key: Key }>["value"];
  };
  table: {
    [tableId: number]: {
      [Key in UserSettingKeyTable]: Extract<UserSetting, { key: Key }>["value"];
    };
  };
  filter: {
    [Key in UserSettingKeyFilter]: Array<Extract<UserSetting, { key: Key }>>;
  };
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

export default (
  state = initialState,
  action: { type: string; settings: Array<UserSetting> }
) => {
  switch (action.type) {
    case SET_USER_SETTINGS: {
      const { settings } = action;

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
    default:
      return state;
  }
};
