import f from "lodash/fp";
import { ColumnKinds } from "../../constants/TableauxConstants";
import {
  reduceValuesToAllowedCountries,
  reduceValuesToAllowedLanguages
} from "../../helpers/accessManagementHelper";
import { makeRequest } from "../../helpers/apiHelper";
import route from "../../helpers/apiRoutes";
import ActionTypes from "../actionTypes";

const {
  CELL_ROLLBACK_VALUE,
  CELL_SAVED_SUCCESSFULLY,
  CELL_SET_VALUE
} = ActionTypes;

export const changeCellValue = action => (dispatch, getState) => {
  const { columnId, tableId } = action;
  const getColumn = f.flow(
    getState,
    f.prop(["columns", tableId, "data"]),
    f.find(f.propEq("id", columnId))
  );
  const column = action.column || getColumn();
  dispatch(dispatchCellValueChange({ ...action, column }));
};

const dispatchCellValueChange = action => {
  const { tableId, columnId, rowId, oldValue, newValue } = action;
  console.log("Change cell value:", oldValue, "->", newValue);
  const update = calculateCellUpdate(action);
  console.log("-- update:", update);

  // bail out if no updates needed
  return f.equals(update.value.value, oldValue)
    ? {
        type: "NOTHING_TO_DO"
      }
    : {
        promise: makeRequest({
          apiRoute:
            route.toCell({ tableId, rowId, columnId }) +
            (update.pathPostfix || ""),
          method: update.method,
          data: update.value
        }),
        actionTypes: [
          CELL_SET_VALUE,
          CELL_SAVED_SUCCESSFULLY,
          CELL_ROLLBACK_VALUE
        ],
        ...f.dissoc("type", action)
      };
};

export const calculateCellUpdate = action => {
  const cellIs = kind => f.propEq("kind", kind);
  return f.cond([
    [cellIs(ColumnKinds.link), calculateLinkCellUpdate],
    [f.always(true), calculateDefaultCellUpdate]
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
    [f.equals(oldIds), noop],
    [isReordering, reorderLinks(oldIds)],
    [isMultiSet, resetLinkValue],
    [f.stubTrue, toggleLink(oldIds)]
  ])(newIds);

  return action({ oldValue, newValue });
};

const resetLinkValue = newIds => ({
  value: { value: newIds },
  method: "PUT"
});

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
        pathPostfix: `/link/${toggler}`
      }
    : {
        method: "PATCH",
        value: { value: toggler }
      };
};
