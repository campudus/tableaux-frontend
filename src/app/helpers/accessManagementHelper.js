import f from "lodash/fp";
import { isRowArchived } from "../archivedRows/helpers";
import {
  ImmutableColumnKinds,
  Langtags,
  LanguageType,
  TableType
} from "../constants/TableauxConstants";
import store from "../redux/store";
import { shouldCheckPermissions } from "./authenticate";
import { doto, memoizeWith, unless } from "./functools";
import { getCountryOfLangtag } from "./multiLanguage";
import T from "./table";

// Table data editing permissions

const lookupKey = (columnId, tableId, rowId) =>
  `${tableId}-${columnId}-${rowId}}`;

// we need to dispatch that on runtime
const lookUpPermissions = params =>
  shouldCheckPermissions ? _lookUpPermissions(params) : ALLOW_ANYTHING;
const _lookUpPermissions = params => {
  const { columnId, tableId, column = {}, table = {}, row = {}, rowId } =
    params || {};
  // we can do this as our DB-indices are one-based
  const _columnId = columnId || (column && column.id);
  const _tableId = tableId || (table && table.id);
  const _rowId = rowId || (row && row.id);

  const permissionsOf = f.propOr({}, "permission");

  const lookupStructureCached = memoizeWith(lookupKey, (tblId, colId) => {
    const state = store.getState();
    const tables = state.tables;
    const columns = f.propOr(["columns", tblId], state);
    const rows = f.propOr({}, ["rows", tblId, "data", state]);

    const lookUpTable = id => f.find(f.propEq(["data", "id"], id), tables);
    const missingColumnIds = id => f.isNil(id) || f.isNil(tblId);
    const lookUpColumns = id =>
      f.compose(f.prop("data"), f.find(f.propEq("id", id)))(columns);

    const foundTable = table || unless(f.isNil, lookUpTable, tblId);
    const foundColumn =
      column || unless(missingColumnIds, lookUpColumns, colId);

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
  return shouldCheckPermissions
    ? lookupStructureCached(_tableId, _columnId, _rowId)
    : ALLOW_ANYTHING;
};

const getPermission = pathToPermission => cell =>
  !T.isUnionTable(cell.table ?? {}) &&
  f.compose(f.propOr(false, pathToPermission), lookUpPermissions)(cell);

export const isSettingsTable = table => table.type === TableType.settings;
export const isCellInSettingsColumn = cell =>
  isSettingsTable(cell.table) &&
  (cell.column.name === "key" || cell.column.name === "displayKey");

//      (cell | {tableId: number, columnId: number}) -> (langtag | nil) -> boolean
export const canUserChangeCell = f.curry((cell, langtag) => {
  const { table, kind, row } = cell ?? {};
  const editCellValue = getPermission(["column", "editCellValue"])(cell);
  const language = f.propEq("column.languageType", LanguageType.country)(cell)
    ? getCountryOfLangtag(langtag)
    : langtag;

  const allowed = f.isBoolean(editCellValue)
    ? editCellValue
    : f.isPlainObject(editCellValue) && editCellValue[language];

  return (
    !isCellInSettingsColumn(cell ?? {}) &&
    !T.isUnionTable(table) &&
    !isRowArchived(row) &&
    !f.contains(kind, ImmutableColumnKinds) &&
    (allowed || !shouldCheckPermissions)
  ); //    this special case is not caught by ALLOW_ANYTHING
});

export const canUserChangeAllLangsOfCell = cellInfo => {
  const langs =
    cellInfo.column.languageType === LanguageType.country
      ? cellInfo.column.countryCodes
      : Langtags;
  return langs.every(canUserChangeCell(cellInfo));
};

export const canUserChangeAnyCountryTypeCell = cellInfo => {
  const allowed = doto(
    cellInfo,
    getPermission(["column", "editCellValue"]),
    f.values,
    f.any(f.identity)
  );
  return allowed || !shouldCheckPermissions;
};

export const canUserChangeCountryTypeCell = canUserChangeCell;
export const canUserEditColumnDisplayProperty = getPermission([
  "column",
  "editDisplayProperty"
]);
export const canUserChangeColumnDisplayName = canUserEditColumnDisplayProperty;
export const canUserChangeColumnDescription = canUserEditColumnDisplayProperty;

export const canUserEditTableDisplayProperty = getPermission([
  "table",
  "editDisplayProperty"
]);
export const canUserChangeTableDisplayName = canUserEditTableDisplayProperty;

export const canUserCreateRow = getPermission(["table", "createRow"]);

export const canUserDeleteRow = getPermission(["table", "deleteRow"]);

export const canUserEditCellAnnotations = getPermission([
  "table",
  "editCellAnnotation"
]);

export const canUserEditRowAnnotations = getPermission([
  "table",
  "editRowAnnotation"
]);

// (tableData: table | number) => boolean
export const canUserSeeTable = memoizeWith(f.identity, tableData => {
  const tableId = f.isObject(tableData) ? tableData.id : tableData;
  const state = store.getState();
  return !!f.prop(["tables", "data", tableId], state);
});

// Media permissions

// must be dispatched at runtime
const lookupMediaPermissions = () =>
  shouldCheckPermissions ? _lookupMediaPermissions() : alwaysTrue;
const _lookupMediaPermissions = () => {
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
export const reduceValuesToAllowedLanguages = f.curryN(2, (context, value) =>
  f.keys(value).reduce((valueObj, langtag) => {
    if (canUserChangeCell(context, langtag)) {
      valueObj[langtag] = value[langtag];
    }
    return valueObj;
  }, {})
);

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
