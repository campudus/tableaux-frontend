import f from "lodash/fp";
import { ColumnKinds } from "../constants/TableauxConstants";
import { buildOriginColumnLookup } from "./columnHelper";
import getDisplayValue from "./getDisplayValue";

export const buildLinkDisplayValueCache = (table, columns, rows) => {
  const getOriginColumn = buildOriginColumnLookup(table, columns);

  const linkColumns = columns
    .map((col, idx) => ({ col, idx }))
    .filter(({ col: { kind } }) => kind === ColumnKinds.link);

  const getIndividualLinkValues = row =>
    linkColumns.flatMap(({ idx, col }) =>
      row.values[idx].map(value => {
        const originColumn = getOriginColumn(col.id, row.tableId);
        return {
          values: [value],
          column: originColumn || col,
          tableId: row.tableId
        };
      })
    );

  const toDisplayValueLookup = (acc, { values, column, tableId }) => {
    const linkRowId = values[0].id;
    const existingDV = f.get([tableId, linkRowId], acc);
    if (f.isNil(existingDV)) {
      acc[tableId] = acc[tableId] || {};
      acc[tableId][linkRowId] = {
        value: getDisplayValue(column, values),
        column,
        id: linkRowId
      };
    }
    return acc;
  };

  const toReduxFormat = f.mapValues(f.values);

  const go = f.compose(
    toReduxFormat,
    f.reduce(toDisplayValueLookup, {}),
    f.flatMap(getIndividualLinkValues)
  );
  const linkDisplayValues = go(rows);

  return linkDisplayValues;
};

const reduce = f.reduce.convert({ cap: false });

const getShiftDistance = (id, originalIdx, changed) =>
  f.compose(
    newIndex => (originalIdx - newIndex) * -1,
    f.findIndex(changedEl => changedEl === id)
  )(changed);

const getShiftedElement = distanceTable =>
  reduce(
    (acc, val, key) => {
      if (
        f.isNil(acc.distance) ||
        Math.abs(val.distance) >= Math.abs(acc.distance)
      ) {
        return { ...val, id: key };
      }
      return acc;
    },
    { originalIdx: null, distance: null, id: null },
    distanceTable
  );

const calcDistanceTable = ({ original, changed }) =>
  reduce(
    (acc, val, idx) => {
      const distance = getShiftDistance(val, idx, changed);
      return { ...acc, [val]: { originalIdx: idx, distance } };
    },
    {},
    original
  );

// if there was a location: "after", this would look way better
const buildRequestParam = ({ original }) => ({ originalIdx, distance, id }) => {
  if (originalIdx + distance < original.length - 1) {
    return {
      id,
      successorId: original[originalIdx + distance + (distance > 0 ? 1 : 0)],
      location: "before"
    };
  } else {
    return {
      id,
      successorId: original[originalIdx + distance],
      location: "end"
    };
  }
};

export const createLinkOrderRequest = data =>
  f.compose(
    buildRequestParam(data),
    getShiftedElement,
    calcDistanceTable
  )(data);
