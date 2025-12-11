import f from "lodash/fp";
import { match, otherwise, when as on } from "match-iz";
import { showClearCellDialog } from "../../components/overlay/ClearCellDialog";
import openTranslationDialog from "../../components/overlay/TranslationDialog";
import {
  ColumnKinds,
  DefaultLangtag,
  Langtags,
  LanguageType
} from "../../constants/TableauxConstants";
import {
  canUserChangeAllLangsOfCell,
  reduceValuesToAllowedCountries,
  reduceValuesToAllowedLanguages
} from "../../helpers/accessManagementHelper";
import {
  addTranslationNeeded,
  removeTranslationNeeded
} from "../../helpers/annotationHelper";
import { makeRequest } from "../../helpers/apiHelper";
import route from "../../helpers/apiRoutes";
import { isValidDate } from "../../helpers/date";
import { merge, when } from "../../helpers/functools";
import { createLinkOrderRequest } from "../../helpers/linkHelper";
import { getCountryOfLangtag } from "../../helpers/multiLanguage";
import ActionTypes from "../actionTypes";
import store from "../store";
import { refreshDependentRows } from "../updateDependentTables";

const {
  SET_STATE,
  CELL_ROLLBACK_VALUE,
  CELL_SAVED_SUCCESSFULLY,
  CELL_SET_VALUE
} = ActionTypes;

export const changeCellValue = action => (dispatch, getState) => {
  // We either get ids directly, or we extract them from a "cell"
  const rowId = (action.cell && action.cell.row.id) || action.rowId;
  const columnId = (action.cell && action.cell.column.id) || action.columnId;
  const tableId = (action.cell && action.cell.table.id) || action.tableId;
  const getColumn = f.flow(
    getState,
    f.prop(["columns", tableId, "data"]),
    f.find(f.propEq("id", columnId))
  );
  const column = action.column || action.cell?.column || getColumn();

  // Merge allowed changes into old cell value, so we can use the
  // delta to calculate a new display value immediately without
  // waiting for the request
  const reduceValue =
    column.languageType === "country"
      ? reduceValuesToAllowedCountries
      : reduceValuesToAllowedLanguages;
  const newValue =
    column.multilanguage && !column.kind === ColumnKinds.link
      ? f.toArray(
          merge(
            action.oldValue,
            reduceValue({ column, tableId }, action.newValue)
          )
        )
      : action.newValue;

  const cell = action.cell || {
    id: `cell-${tableId}-${columnId}-${rowId}`,
    column,
    table: { ...(action.table ?? {}), id: tableId },
    row: { ...(action.row ?? {}), id: rowId }
  };

  if (!action.cell) {
    // TODO: This is mostly required to check if a cell can be completely
    // cleared. All currently clearable cell types pass cells in properly.
    // Once this error stops appearing, we can remove the check.
    console.error("NO CELL OBJECT PASSED IN, using Fallback");
  }
  if (
    !action.dontClear &&
    shouldShowClearDialog({
      column,
      oldValue: action.oldValue,
      newValue,
      cell: action.cell
    })
  ) {
    showClearCellDialog({ ...action, cell });
  }
  return dispatch(
    dispatchCellValueChange({
      ...action,
      column,
      columnId,
      rowId,
      tableId,
      newValue,
      cell
    })
  );
};

const getPrimaryLanguage = cell =>
  cell.column.languageType === LanguageType.country
    ? cell.column.countryCodes[0]
    : DefaultLangtag;

export const isEmptyValue = (columnKind, value) => {
  const isEmptyNumberInputValue = x =>
    f.isEmpty(x) && (typeof x !== "number" || isNaN(x));
  const checkValue = match(columnKind)(
    on(ColumnKinds.date, f.always(f.negate(isValidDate))),
    on(ColumnKinds.datetime, f.always(f.negate(isValidDate))),
    on(ColumnKinds.integer, f.always(isEmptyNumberInputValue)),
    on(ColumnKinds.numeric, f.always(isEmptyNumberInputValue)),
    on(ColumnKinds.currency, f.always(f.isNil)),
    otherwise(f.always(f.isEmpty))
  );
  return checkValue(value);
};

export const getEmptyValue = columnKind =>
  match(columnKind)(
    on(ColumnKinds.attachment, []),
    on(ColumnKinds.link, []),
    otherwise(f.always(null))
  );

const clearableColumnKinds = [
  ColumnKinds.currency,
  ColumnKinds.date,
  ColumnKinds.datetime,
  ColumnKinds.integer,
  ColumnKinds.numeric,
  ColumnKinds.richtext,
  ColumnKinds.shorttext,
  ColumnKinds.text
];

const shouldShowClearDialog = ({ cell, column, oldValue, newValue }) => {
  const typeIsToClear = clearableColumnKinds.includes(column.kind);
  const isMultilanguage = column.multilanguage;
  const primaryLanguage = getPrimaryLanguage(cell);
  const mainLangtagChanged = f.has(primaryLanguage, newValue);
  const valueHasBeenCleared =
    isMultilanguage &&
    !isEmptyValue(column.kind, oldValue[primaryLanguage]) &&
    isEmptyValue(column.kind, newValue[primaryLanguage]);
  const hasValuesToClear =
    Object.entries({ ...oldValue, ...newValue }).filter(
      ([lt, val]) => lt !== primaryLanguage && !isEmptyValue(column.kind, val)
    ).length > 0;
  return (
    isMultilanguage &&
    mainLangtagChanged &&
    typeIsToClear &&
    valueHasBeenCleared &&
    hasValuesToClear &&
    canUserChangeAllLangsOfCell(cell)
  );
};

const empty = cell => {
  const mempty = getEmptyValue(cell.column.kind);
  const langtags =
    cell.column.languageType === LanguageType.country
      ? cell.column.countryCodes
      : Langtags;
  return Object.fromEntries(
    langtags.map(lt => [lt, mempty]),
    cell
  );
};

export const clearSelectedCellValue = (cell, langtag) => {
  const mempty = getEmptyValue(cell.column.kind);
  const langtagToClear =
    cell.column.languageType === LanguageType.country
      ? getCountryOfLangtag(langtag)
      : langtag;
  const clearedValue =
    cell.column.multilanguage && cell.column.kind !== ColumnKinds.link
      ? { [langtagToClear]: mempty }
      : mempty;
  store.dispatch(
    changeCellValue({ cell, oldValue: cell.value, newValue: clearedValue })
  );
};

export const clearMultilangCell = cell => {
  if (!cell?.column?.multilanguage) {
    throw new Error(`${cell?.id} is not a multilanguage cell`);
  }
  const emptyValue = empty(cell);
  const action = () => ({
    cell,
    column: cell.column,
    oldValue: cell.value,
    newValue: emptyValue,
    tableId: cell.table.id,
    columnId: cell.column.id,
    rowId: cell.row.id,
    promise: makeRequest({
      method: "POST",
      apiRoute: route.toCell({
        tableId: cell.table.id,
        columnId: cell.column.id,
        rowId: cell.row.id
      }),
      data: { value: emptyValue }
    }),
    onSuccess: () => {
      removeTranslationNeeded(Langtags, cell);
    },
    actionTypes: [CELL_SET_VALUE, CELL_SAVED_SUCCESSFULLY, CELL_ROLLBACK_VALUE]
  });
  store.dispatch(action());
};

const dispatchCellValueChange = action => (dispatch, getState) => {
  const { tableId, columnId, rowId, oldValue, newValue, column, cell } = action;

  // The additional checks help normalising bad link columns' values
  const isMultiLanguage =
    column.multilanguage && (f.isPlainObject(newValue) || f.isNil(newValue));

  const update = calculateCellUpdate({ ...cell, ...action });
  if (f.isNil(update)) {
    return Promise.resolve();
  }
  const changedKeys = isMultiLanguage
    ? f.compose(
        f.filter(k => !f.equals(oldValue[k], update.value.value[k])),
        f.union
      )(f.keys(newValue), f.keys(oldValue))
    : [];

  const needsUpdate = isMultiLanguage
    ? !f.isEmpty(changedKeys)
    : !f.isEqual(oldValue, newValue);

  const mainLang = f.head(Langtags);
  const onlyMainLangChanged = f.equals(changedKeys, [mainLang]);
  const hasTranslations = f.compose(
    f.some(f.negate(f.isEmpty)),
    f.values,
    f.omit([f.head(Langtags)])
  )(oldValue);

  const mainLangChecks =
    isMultiLanguage && newValue[mainLang] && onlyMainLangChanged;

  // ask if cell should be marked with translation_needed, when
  // there's a change in the main language
  if (!action.skipTranslationDialog && mainLangChecks && hasTranslations) {
    openTranslationDialog(
      null,
      () => addTranslationNeeded(f.tail(Langtags), cell),
      () => null
    );
  }

  // automatically add translation_needed if cell is new
  if (mainLangChecks && !hasTranslations) {
    addTranslationNeeded(f.tail(Langtags), cell);
  }

  const annotations = f.compose(
    f.get("annotations"),
    f.find(f.propEq("id", rowId)),
    f.get(["rows", tableId, "data"])
  )(getState());

  const annotation = f.compose(
    colIdx => f.get([colIdx], annotations),
    f.findIndex(f.propEq("id", columnId)),
    f.get(["columns", tableId, "data"])
  )(getState());

  const maybeClearFreshTranslations = res => {
    if (!f.isEmpty(changedKeys) && !onlyMainLangChanged && annotation) {
      removeTranslationNeeded(changedKeys, cell);
    }
    return res;
  };

  // bail out if no updates needed
  return new Promise((resolve, reject) => {
    if (!needsUpdate) {
      dispatch({
        type: "NOTHING_TO_DO"
      });
      resolve();
    } else {
      dispatch({
        promise: makeRequest({
          apiRoute:
            route.toCell({ tableId, rowId, columnId }) +
            (update.pathPostfix || ""),
          method: update.method,
          data: when(
            () => isMultiLanguage,
            f.update("value", f.pick(changedKeys)),
            update.value
          )
        }).then(maybeClearFreshTranslations),
        onSuccess: resolve,
        onError: reject,
        actionTypes: [
          CELL_SET_VALUE,
          CELL_SAVED_SUCCESSFULLY,
          CELL_ROLLBACK_VALUE
        ],
        ...f.dissoc("type", action)
      });
    }
  })
    .then(() =>
      maybeUpdateStatusColumnValue(tableId, columnId, rowId)(dispatch, store)
    )
    .then(() => refreshDependentRows(tableId, [rowId], store.getState()))
    .then(state => dispatch({ type: SET_STATE, state }));
};

const maybeUpdateStatusColumnValue = (tableId, columnId, rowId) => (
  dispatch,
  store
) => {
  const state = store.getState();
  const calcDependentColumnIds = conditions => {
    return f.flatMap(condition => {
      return f.has("column", condition)
        ? condition.column
        : calcDependentColumnIds(condition);
    }, conditions.values);
  };
  const statusColumns = f.filter(
    column => column.kind === ColumnKinds.status,
    state.columns[tableId].data
  );
  if (f.isEmpty(statusColumns)) {
    return;
  }
  return f.compose(
    promises => Promise.all(promises),
    f.map(({ column, dependentColumnIds }) => {
      if (f.contains(columnId, dependentColumnIds)) {
        return makeRequest({
          apiRoute: route.toCell({ tableId, rowId, columnId: column.id })
        }).then(res =>
          dispatch({
            type: CELL_SET_VALUE,
            tableId,
            columnId: column.id,
            rowId,
            newValue: res.value,
            column
          })
        );
      }
    }),
    f.zipWith(
      (column, dependentColumnIds) => ({ column, dependentColumnIds }),
      statusColumns
    ),
    f.map(f.compose(f.uniq, f.flatten)),
    f.map(column =>
      f.map(rule => calcDependentColumnIds(rule.conditions), column.rules)
    )
  )(statusColumns);
};

export const calculateCellUpdate = action => {
  const { column, oldValue, newValue, method } = action;

  if (
    column.kind === ColumnKinds.link ||
    column.kind === ColumnKinds.attachment
  ) {
    const idKey = column.kind === ColumnKinds.attachment ? "uuid" : "id";
    const oldIds = f.map(idKey, oldValue);
    const newIds = f.map(idKey, newValue);
    const isSame = f.equals(newIds, oldIds);
    const isReordering =
      newIds.length === oldIds.length &&
      newIds.length > 1 &&
      f.intersection(oldIds, newIds).length === newIds.length;
    const isReset =
      f.xor(newIds, oldIds).length > 1 ||
      //Backend fails sometimes on a patch with the first link
      (f.isEmpty(oldIds) && newIds.length === 1);

    const [swapee, successor, location] = f.props(
      ["id", "successorId", "location"],
      createLinkOrderRequest({ original: oldIds, changed: newIds })
    );
    const reorderAction = {
      method: "PUT",
      value: { location, id: successor },
      pathPostfix: `/${column.kind}/${swapee}/order`
    };

    const resetAction = {
      value: { value: newIds },
      method: "PUT"
    };

    const toggleId = f.xor(oldIds, newIds)[0];
    const toggleAction = f.contains(toggleId, oldIds)
      ? {
          method: "DELETE",
          pathPostfix: `/${column.kind}/${toggleId}`,
          value: {}
        }
      : {
          method: "PATCH",
          value: { value: toggleId }
        };

    return isSame
      ? null
      : isReordering
      ? reorderAction
      : isReset
      ? resetAction
      : toggleAction;
  } else {
    const reduceLangs = f.flow(
      reduceValuesToAllowedLanguages(action),
      merge(oldValue)
    );
    const reduceCountries = f.flow(
      reduceValuesToAllowedCountries(action),
      merge(oldValue)
    );

    const allowedChangeValue = f.cond([
      [f.complement(f.isObject), f.identity],
      [() => column.languageType === "country", reduceCountries],
      [() => column.multilanguage, reduceLangs],
      [f.always, f.identity]
    ])(newValue);

    return {
      value: { value: allowedChangeValue },
      method: method || "POST"
    };
  }
};

export const modifyHistory = (modifyAction, tableId, rowId) => (
  dispatch,
  getState
) => {
  const rowSpecific = !f.isNil(rowId);
  const findFn = rowSpecific
    ? f.overEvery([f.propEq("tableId", tableId), f.propEq("rowId", rowId)])
    : f.propEq("tableId", tableId);
  const historyAction = f.compose(
    f.findLast(findFn),
    f.get([
      "tableView",
      "history",
      modifyAction === "undo" ? "undoQueue" : "redoQueue"
    ])
  )(getState());

  if (!historyAction) {
    return;
  }

  dispatch(changeCellValue({ ...historyAction, modifyAction }));
};
