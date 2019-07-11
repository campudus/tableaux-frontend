import f from "lodash/fp";

import { Langtags } from "../constants/TableauxConstants";
import { memoizeWith, unless } from "./functools";
import { noAuthNeeded } from "./authenticate";
import store from "../redux/store";

// Table data editing permissions

const lookupKey = (columnId, tableId, rowId) =>
  `${tableId}-${columnId}-${rowId}}`;

const lookUpPermissions = noAuthNeeded
  ? ALLOW_ANYTHING
  : params => {
      const { columnId, tableId, column, table, row, rowId } = params;
      // we can do this as our DB-indices are one-based
      const _columnId = columnId || (column && column.id);
      const _tableId = tableId || (table && table.id);
      const _rowId = rowId || (row && row.id);

      const permissionsOf = f.propOr({}, "permissions");

      const lookupStructureCached = memoizeWith(lookupKey, (tblId, colId) => {
        const state = store.getState();
        const tables = state.tables.data;
        const columns = state.columns[tblId];
        const rows = (tblId && state.rows[tblId].data) || {};

        const lookUpTable = id => f.find(f.propEq("id", id), tables);
        const missingColumnIds = id => f.isNil(id) || f.isNil(tblId);
        const lookUpColumns = id => f.find(f.propEq("id", id), columns);

        const foundTable = table || unless(f.isNil, lookUpTable, tblId);
        const foundColumn =
          column || unless(missingColumnIds, lookUpColumns, colId);

        return ALLOW_ANYTHING;
        return {
          tables: permissionsOf(tables),
          columns: permissionsOf(columns),
          table: permissionsOf(foundTable),
          column: permissionsOf(foundColumn),
          rows: permissionsOf(rows),
          row: row && permissionsOf(row)
        };
      });

      // assumption: table structure & permissions won't change during session
      return noAuthNeeded
        ? ALLOW_ANYTHING
        : lookupStructureCached(_tableId, _columnId, _rowId);
    };

const getPermission = pathToPermission =>
  f.compose(
    f.propOr(false, pathToPermission),
    lookUpPermissions
  );

// (cell | {tableId: number, columnId: number}) -> (langtag | nil) -> boolean
export const canUserChangeCell = (cellInfo, langtag) => {
  const editCellValue = getPermission(["column", "editCellValue"])(cellInfo);

  const allowed = langtag
    ? f.isPlainObject(editCellValue) && editCellValue[langtag]
    : editCellValue;

  return allowed || noAuthNeeded; // this special case is not caught by ALLOW_ANYTHING
};

export const canUserEditColumnDisplayProperty = getPermission([
  "column",
  "editDisplayProperty"
]);
export const canUserChangeColumnDisplayName = canUserEditColumnDisplayProperty;
export const canUserChangeColumnDescription = canUserEditColumnDisplayProperty;

export const canUserEditRows = memoizeWith(
  f.prop(["table", "id"]),
  cellInfo => {
    const tableId = cellInfo.tableId || (cellInfo.table && cellInfo.table.id);
    const columns = store.getState().columns[tableId].data;
    return columns.reduce(
      (allowed, nextColumn) =>
        allowed && canUserChangeCell({ ...cellInfo, column: nextColumn }),
      true
    );
  }
}

export const canUserEditTableDisplayProperty = getPermission([
  "table",
  "editDisplayProperty"
]);
export const canUserChangeTableDisplayName = canUserEditTableDisplayProperty;

export const getUserCountryCodesAccess = f.memoize(function() {
  if (isUserAdmin()) {
    return []; // there's no "all available country codes" because it's bound to a column
  } else {
    return Cookies.getJSON("userCountryCodesAccess") || [];
  }
});

export const hasUserAccessToCountryCode = f.memoize(function(countryCode) {
  if (isUserAdmin()) {
    return true;
  }

  if (f.isString(countryCode)) {
    const userCountryCodes = getUserCountryCodesAccess();
    return userCountryCodes && userCountryCodes.length > 0
      ? userCountryCodes.indexOf(countryCode) > -1
      : false;
  } else {
    console.error(
      "hasUserAccessToCountryCode() has been called with unknown parameter countryCode:",
      countryCode
    );
    return false;
  }
});

export const isUserAdmin = f.memoize(function() {
  const isAdminFromCookie = Cookies.getJSON("userAdmin");
  if (!f.isNil(isAdminFromCookie)) {
    return isAdminFromCookie;
  } else return false;
});

// (tableData: table | number) => boolean
export const canUserSeeTable = memoizeWith(f.identity, tableData => {
  const tableId = f.isObject(tableData) ? tableData.id : tableData;
  const state = store.getState();
  return !!f.prop(["tables", "data", tableId], state);
});

// Media permissions

const lookupMediaPermissions = noAuthNeeded
  ? () => alwaysTrue
  : () => {
      const state = store.getState();
      const permissions = f.propOr({}, ["media", "data", "permission"], state);
      return permissions;
    };

const getMediaPermission = action => () => {
  const allowed = f.propOr(false, action, lookupMediaPermissions());
  return allowed;
};

export const canUserCreateMedia = getMediaPermission("create");
export const canUserCreateFiles = canUserCreateMedia;
export const canUserCreateFolders = canUserCreateMedia;

export const canUserEditMedia = getMediaPermission("edit");
export const canUserEditFiles = canUserEditMedia;
export const canUserEditFolders = canUserEditMedia;

export const canUserEditMediaMetadata = getMediaPermission(
  "editDisplayProperty"
);
export const canUserDeleteMedia = getMediaPermission("delete");
export const canUserDeleteFiles = canUserDeleteMedia;
export const canUserDeleteFolders = canUserDeleteMedia;

// (context: {column, tableId}) -> (value: {}) -> {}
// Ensure we only send changes that the user is allowed to send to the backend
export const reduceValuesToAllowedLanguages = f.curryN(2, (context, value) => {
  const accessibleLangs = Langtags.filter(langtag =>
    canUserChangeCell(context, langtag)
  );
  return f.pick(accessibleLangs, value);
});
// With new per-column permission model, both functions are equivalent
export const reduceValuesToAllowedCountries = reduceValuesToAllowedLanguages;

// For dev only. Create a permission object that always returns true for
// arbitrary permission[scope][action]
const trueTrap = { get: () => true };
const alwaysTrue = new Proxy({}, trueTrap); // permission[action] -> true
const trueTrapTrap = { get: () => alwaysTrue };
const ALLOW_ANYTHING = new Proxy({}, trueTrapTrap);

// TODO: implement this stuff
export const getUserLanguageAccess = () => Langtags;
// export const getUserCountryCodeAccess = () => []; // unused?
export const reduceMediaValuesToAllowedLanguages = f.identity;

export const hasUserAccessToLanguage = f.stubTrue;

// export function reduceMediaValuesToAllowedLanguages(fileInfos) {
// if (isUserAdmin()) {
//   return fileInfos;
// }
// return f.map(fileInfo => {
//   if (f.isObject(fileInfo)) {
//     return f.pick(getUserLanguageAccess(), fileInfo);
//   } else {
//     return fileInfo;
//   }
// }, fileInfos);
//   return fileInfos;
// }
