import {
  always,
  complement,
  cond,
  contains,
  dropWhile,
  equals,
  flow,
  identity,
  intersection,
  isObject,
  nth,
  map,
  merge,
  noop,
  take,
  xor
} from "lodash/fp";
import { ColumnKinds } from "../../constants/TableauxConstants";
import {
  reduceValuesToAllowedCountries,
  reduceValuesToAllowedLanguages
} from "../../helpers/accessManagementHelper";
import { makeRequest } from "../../helpers/apiHelper";
import route from "../../helpers/apiRoutes";
import { isMultiCountry, isMultiLanguage } from "../../helpers/multiLanguage";
import ActionTypes from "../actionTypes";

const {
  CELL_ROLLBACK_VALUE,
  CELL_SAVED_SUCCESSFULLY,
  CELL_SET_VALUE
} = ActionTypes;

export const changeCellValue = ({
  tableId,
  columnId,
  rowId,
  kind,
  oldValue,
  newValue
}) => {
  console.log("Change cell value:", oldValue, "->", newValue);
  const update = calculateCellUpdate({
    oldValue,
    newValue,
    cellKind: kind
  });
  console.log("-- update:", update);

  // bail out if no updates needed
  return equals(update.value.value, oldValue)
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
        tableId,
        columnId,
        rowId,
        newValue,
        oldValue
      };
};

export const calculateCellUpdate = ({ oldValue, newValue, cellKind }) => {
  const cellIs = kind => ({ cellKind }) => kind === cellKind;
  return cond([
    [cellIs(ColumnKinds.link), calculateLinkCellUpdate],
    [always(true), calculateDefaultCellUpdate]
  ])({ oldValue, newValue, cellKind });
};

const calculateDefaultCellUpdate = ({ oldValue, newValue }) => {
  const reduceLangs = flow(
    reduceValuesToAllowedLanguages,
    merge(oldValue)
  );
  const reduceCountries = flow(
    reduceValuesToAllowedCountries,
    merge(oldValue)
  );

  const allowedChangeValue = cond([
    [complement(isObject), identity],
    [isMultiLanguage, reduceLangs],
    [isMultiCountry, reduceCountries],
    [always(true), identity]
  ])(newValue);

  return {
    value: { value: allowedChangeValue },
    method: "POST"
  };
};

const calculateLinkCellUpdate = ({ oldValue, newValue }) => {
  const oldIds = map("id", oldValue);
  const newIds = map("id", newValue);
  const isReordering = linkList =>
    linkList.length === oldIds.length &&
    linkList.length > 1 &&
    intersection(oldIds, linkList).length === linkList.length;
  const isMultiSet = linkList => xor(linkList, oldIds).length > 1;

  const action = cond([
    [equals(oldIds), noop],
    [isReordering, reorderLinks(oldIds)],
    [isMultiSet, resetLinkValue],
    [always(true), toggleLink(oldIds)]
  ])(newIds);

  return action({ oldValue, newValue });
};

const resetLinkValue = newIds => ({
  value: { value: newIds },
  method: "PUT"
});

const reorderLinks = oldIds => newIds => {
  const [swapee, successor] = flow(
    dropWhile(([a, b]) => a === b),
    take(2),
    map(nth(1))
  )([oldIds, newIds]);

  return {
    method: "PUT",
    value: { location: "before", id: successor },
    pathPostfix: `/link/${swapee}/order`
  };
};

const toggleLink = oldIds => newIds => {
  const toggler = xor(oldIds, newIds)[0];
  return contains(toggler, oldIds)
    ? {
        method: "DELETE",
        pathPostfix: `/link/${toggler}`
      }
    : {
        method: "PATCH",
        value: { value: toggler }
      };
};
