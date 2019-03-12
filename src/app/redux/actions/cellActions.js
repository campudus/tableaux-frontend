import f from "lodash/fp";

import { ColumnKinds } from "../../constants/TableauxConstants";
import { makeRequest } from "../../helpers/apiHelper";
import {
  reduceValuesToAllowedCountries,
  reduceValuesToAllowedLanguages
} from "../../helpers/accessManagementHelper";
import { removeTranslationNeeded } from "../../helpers/annotationHelper";
import ActionTypes from "../actionTypes";
import route from "../../helpers/apiRoutes";

const {
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
  const column =
    action.column || (action.cell && action.cell.column) || getColumn();

  // Merge allowed changes into old cell value, so we can use the
  // delta to calculate a new display value immediately without
  // waiting for the request
  const reduceValue =
    column.languageType === "country"
      ? reduceValuesToAllowedCountries
      : reduceValuesToAllowedLanguages;
  const newValue =
    column.multilanguage && !column.kind === ColumnKinds.link
      ? f.toArray(f.merge(action.oldValue, reduceValue(action.newValue)))
      : action.newValue;

  dispatch(
    dispatchCellValueChange({
      ...action,
      column,
      columnId,
      rowId,
      tableId,
      newValue
    })
  );
};

const dispatchCellValueChange = action => (dispatch, getState) => {
  const { tableId, columnId, rowId, oldValue, newValue, column } = action;
  const update = calculateCellUpdate(action);

  const needsUpdate = column.multilanguage
    ? !f.every(
        k => f.isEqual(oldValue[k], newValue[k]),
        f.union(f.keys(newValue), f.keys(oldValue))
      )
    : !f.isEqual(oldValue, newValue);

  // Automatic workflow to remove "translation needed" from newly written values
  const freshlyTranslatedLangtags =
    needsUpdate && column.multilanguage
      ? f
          .keys(newValue)
          .filter(k => f.isEmpty(action.oldValue[k]) && !f.isEmpty(newValue[k]))
      : null;

  const annotations = f.get(
    ["rows", tableId, "data", rowId, "annotations"],
    getState()
  );

  const maybeClearFreshTranslations = res => {
    if (!f.isEmpty(freshlyTranslatedLangtags) && annotations) {
      removeTranslationNeeded(freshlyTranslatedLangtags, {
        column,
        row: { id: rowId },
        table: { id: tableId }
      });
    }
    return res;
  };

  // bail out if no updates needed
  return !needsUpdate
    ? dispatch({
        type: "NOTHING_TO_DO"
      })
    : dispatch({
        promise: makeRequest({
          apiRoute:
            route.toCell({ tableId, rowId, columnId }) +
            (update.pathPostfix || ""),
          method: update.method,
          data: update.value
        }).then(maybeClearFreshTranslations),
        actionTypes: [
          CELL_SET_VALUE,
          CELL_SAVED_SUCCESSFULLY,
          CELL_ROLLBACK_VALUE
        ],
        ...f.dissoc("type", action)
      });
};

export const calculateCellUpdate = action => {
  const cellIs = kind => f.propEq(["column", "kind"], kind);
  return f.cond([
    [cellIs(ColumnKinds.link), calculateLinkCellUpdate],
    [f.stubTrue, calculateDefaultCellUpdate]
  ])(action);
};

const calculateDefaultCellUpdate = ({ column, oldValue, newValue, method }) => {
  const reduceLangs = f.flow(
    reduceValuesToAllowedLanguages,
    f.merge(oldValue)
  );
  const reduceCountries = f.flow(
    reduceValuesToAllowedCountries,
    f.merge(oldValue)
  );

  const allowedChangeValue = f.cond([
    [f.complement(f.isObject), f.identity],
    [() => column.languageType === "country", reduceCountries],
    [() => column.multilanguage, reduceLangs],
    [f.always(true), f.identity]
  ])(newValue);

  return {
    value: { value: allowedChangeValue },
    method: method || "POST"
  };
};

const calculateLinkCellUpdate = ({ oldValue, newValue }) => {
  const oldIds = f.map("id", oldValue);
  const newIds = f.map("id", newValue);
  const isReordering = linkList =>
    linkList.length === oldIds.length &&
    linkList.length > 1 &&
    f.intersection(oldIds, linkList).length === linkList.length;
  const isMultiSet = linkList => f.xor(linkList, oldIds).length > 1;

  const action = f.cond([
    [f.equals(oldIds), f.noop],
    [isReordering, reorderLinks(oldIds)],
    [isMultiSet, resetLinkValue],
    [f.stubTrue, toggleLink(oldIds)]
  ])(newIds);

  return action;
};

const resetLinkValue = newIds => {
  return {
    value: { value: newIds },
    method: "PUT"
  };
};

const reorderLinks = oldIds => newIds => {
  const [swapee, successor] = f.flow(
    f.dropWhile(([a, b]) => a === b),
    f.take(2),
    f.map(f.nth(1))
  )([oldIds, newIds]);

  return {
    method: "PUT",
    value: { location: "before", id: successor },
    pathPostfix: `/link/${swapee}/order`
  };
};

const toggleLink = oldIds => newIds => {
  const toggler = f.xor(oldIds, newIds)[0];
  return f.contains(toggler, oldIds)
    ? {
        method: "DELETE",
        pathPostfix: `/link/${toggler}`,
        value: {}
      }
    : {
        method: "PATCH",
        value: { value: toggler }
      };
};

export const modifyHistory = (modifyAction, tableId) => (
  dispatch,
  getState
) => {
  const historyAction = f.compose(
    f.findLast(action => action.tableId === tableId),
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
