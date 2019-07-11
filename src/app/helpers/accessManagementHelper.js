import f from "lodash/fp";

import { noAuthNeeded } from "./authenticate";
import { unless } from "./functools";
import store from "../redux/store";

const lookupKey = (columnId, tableId) => `${tableId}-${columnId}}`;

const lookUpPermissions = noAuthNeeded
  ? ALLOW_ANYTHING
  : params => {
      const { columnId, tableId, column, table } = params;
      // we can do this as our DB-indices are one-based
      const _columnId = columnId || (column && column.id);
      const _tableId = tableId || (table && table.id);

      if (_columnId && !_tableId) {
        throw new Error(
          "Need either table, tableId, or column object to look up column permissions:\n" +
            JSON.stringify(params, null, 2)
        );
      }

      const permissionsOf = f.propOr({}, "permissions");

      const lookupStructureCached = f.memoizeWith(lookupKey, (tblId, colId) => {
        const state = store.getState();
        const tables = state.tables.data;
        const columns = state.columns[colId];

        const lookUpTable = id => f.find(f.propEq("id", id), tables);
        const missingColumnIds = id => f.isNil(id) || f.isNil(tblId);
        const lookUpColumns = id => f.find(f.propEq("id", id), columns);

        const foundTable = table || unless(f.isNil, lookUpTable, tblId);
        const foundColumn =
          column || unless(missingColumnIds, lookUpColumns, colId);

        return {
          tables: permissionsOf(tables),
          columns: permissionsOf(columns),
          table: permissionsOf(foundTable),
          column: permissionsOf(foundColumn)
        };
      });

      // assumption: table structure won't change during session
      return lookupStructureCached(_tableId, _columnId);
    };

const getPermission = pathToPermission =>
  f.compose(
    f.propOr(false, pathToPermission),
    lookUpPermissions
  );

// (cell | {tableId: number, columnId: number}) -> (langtag | nil) -> boolean
export const canUserChangeCell = (cellInfo, langtag) => {
  const editCellValue = getPermission(["column", "editCellValue"]);
  return langtag
    ? f.isObject(editCellValue) && editCellValue[langtag]
    : editCellValue;
};

export const canUserEditCellDisplayProperty = getPermission([
  "column",
  "editDisplayProperty"
]);
export const canUserChangeColumnDisplayName = canUserEditCellDisplayProperty;
export const canUserChangeColumnDescription = canUserEditCellDisplayProperty;

export const canUserEditTableDisplayProperty =
  getPermission[("table", "editDisplayProperty")];
export const canUserChangeTableDisplayName = canUserEditTableDisplayProperty;

export const canUserCreateRow = getPermission(["table", "createRow"]);

export const canUserDeleteRow = getPermission(["table", "deleteRow"]);

export const canUserEditCellAnnotations = getPermission([
  "table",
  "editCellAnnotation"
]);

export const canUserEditRowAnnotations = getPermission([
  "table",
  "editRowAnnotations"
]);

const lookupMediaPermissions = () => alwaysTrue;
const getMediaPermission = action =>
  f.propOr(false, action, lookupMediaPermissions());

export const canUserCreateMedia = getMediaPermission("createMedia");
export const canUserCreateFiles = canUserCreateMedia;
export const canUserCreateFolders = canUserCreateMedia;

export const canUserEditMedia = getMediaPermission("editMedia");
export const canUserEditFiles = canUserEditMedia;
export const canUserEditFolders = canUserEditMedia;

export const canUserEditMediaMetadata = getMediaPermission(
  "editDisplayProperty"
);
export const canUserDeleteMedia = getMediaPermission("deleteMedia");
export const canUserDeleteFiles = canUserDeleteMedia;
export const canUserDeleteFolders = canUserDeleteMedia;

// For dev only. Create a permission object that always returns true for
// arbitrary permission[scope][action]
const trueTrap = { get: () => true };
const alwaysTrue = new Proxy({}, trueTrap);
const trueTrapTrap = { get: () => alwaysTrue };
const ALLOW_ANYTHING = new Proxy({}, trueTrapTrap);

// Reduce the value object before sending to server, so that just allowed languages get sent
export function reduceValuesToAllowedLanguages(valueToChange) {
  if (isUserAdmin()) {
    return valueToChange;
  } else {
    return f.pick(getUserLanguageAccess(), valueToChange);
  }
}

// Reduce the value object before sending to server, so that just allowed countries get sent
export function reduceValuesToAllowedCountries(valueToChange) {
  if (isUserAdmin()) {
    return valueToChange;
  } else {
    return f.pick(getUserCountryCodesAccess(), valueToChange);
  }
}

export function reduceMediaValuesToAllowedLanguages(fileInfos) {
  if (isUserAdmin()) {
    return fileInfos;
  }
  return f.map(fileInfo => {
    if (f.isObject(fileInfo)) {
      return f.pick(getUserLanguageAccess(), fileInfo);
    } else {
      return fileInfo;
    }
  }, fileInfos);
}
