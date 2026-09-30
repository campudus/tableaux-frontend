import f from "lodash/fp";
import { batch } from "react-redux";
import { either } from "./functools";
import {
  UserSettingKeyFilter,
  UserSettingKeyGlobal,
  UserSettingKeyTable,
  UserSettingValue
} from "../types/userSettings";
import actions from "../redux/actionCreators";
import store from "../redux/store";

/** LocalStorage -> "globalSettings" */
type GlobalSettings = {
  [Key in UserSettingKeyGlobal]: UserSettingValue<Key>;
};

type TableSettings = {
  [Key in UserSettingKeyTable]: UserSettingValue<Key>;
};

type FilterSettings = {
  rowsFilter: UserSettingValue<"rowsFilter">;
};

type TableView = {
  default: TableSettings;
};

type FilterView = {
  [name: string]: FilterSettings;
};

/** LocalStorage -> "tableViews" */
type TableViews = {
  [tableId: number]: TableView;
  "*": FilterView;
};

function readLocalStorage(key: string) {
  return either(localStorage)
    .map(f.get(key))
    .map(JSON.parse)
    .getOrElse({});
}

/**
 * initialize user settings from localStorage
 */
async function initUserSettings() {
  const globalSettings: GlobalSettings = readLocalStorage("globalSettings");
  const tableViews: TableViews = readLocalStorage("tableViews");

  batch(() => {
    // global settings
    for (const [key, value] of f.entries(globalSettings)) {
      const settingKey = key as keyof GlobalSettings;
      const settingValue = value as GlobalSettings[typeof settingKey];

      store.dispatch(
        actions.upsertUserSetting(
          { kind: "global", key: settingKey },
          { value: settingValue }
        )
      );
    }

    // filter/table settings
    for (const id of f.keys(tableViews)) {
      if (id === "*") {
        // filter settings
        const filterView = tableViews[id];

        for (const [settingName, filterSettings] of f.entries(filterView)) {
          const settingKey: UserSettingKeyFilter = "presetFilter";
          const settingValue = filterSettings.rowsFilter;

          store.dispatch(
            actions.upsertUserSetting(
              { kind: "filter", key: settingKey },
              { name: settingName, value: settingValue }
            )
          );
        }
      } else {
        // table settings
        const tableId = parseInt(id);
        const tableView = tableViews[tableId]!;
        const tableSettings = tableView.default;

        for (const [key, value] of f.entries(tableSettings)) {
          const settingKey = key as keyof TableSettings;
          const settingValue = value as TableSettings[typeof settingKey];

          store.dispatch(
            actions.upsertUserSetting(
              { kind: "table", tableId, key: settingKey },
              { value: settingValue }
            )
          );
        }
      }
    }
  });
}

export default initUserSettings;
