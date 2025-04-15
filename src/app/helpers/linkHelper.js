import f from "lodash/fp";
import { ColumnKinds } from "../constants/TableauxConstants";

const mapIndexed = f.map.convert({ cap: false });
const getLinkColumns = columns =>
  f.compose(
    f.compact,
    mapIndexed((column, index) => {
      const { kind } = column;
      if (kind === ColumnKinds.link) {
        const { toTable } = column;
        return { index: index, tableId: toTable };
      }
      return null;
    })
  )(columns);

const mergeSameTables = allElements => {
  const { mergedValues } = f.reduce(
    (acc, val) => {
      const { tableId } = val;
      const { mergedValues, mergedIds } = acc;
      if (f.contains(tableId, mergedIds)) {
        return acc;
      }
      const merged = {
        ...val,
        values: f.compose(
          f.flatMap("values"),
          f.filter(element => element.tableId === tableId)
        )(allElements)
      };
      return {
        mergedValues: f.concat(mergedValues, [merged]),
        mergedIds: f.concat(mergedIds, [tableId])
      };
    },
    { mergedValues: [], mergedIds: [] },
    allElements
  );
  return f.flatten(mergedValues);
};

const identifyUniqueLinkedRows = (rows, columns) => {
  const linkColumns = getLinkColumns(columns);
  const linkIndexes = f.map("index", linkColumns);
  return f.compose(
    mergeSameTables,
    f.sortBy(["tableId"]),
    mapIndexed((arr, index) => {
      const { tableId } = linkColumns[index];
      return { tableId, values: arr, column: columns[linkIndexes[index]] };
    }),
    f.map(element => f.sortedUniqBy("id", f.sortBy("id", element))),
    f.map(f.flatten),
    f.zipAll,
    f.map(f.props(linkIndexes)),
    f.map("values")
  )(rows);
};

const combineDisplayValuesWithLinks = (allDisplayValues, columns, tableId) => {
  if (f.isEmpty(allDisplayValues)) {
    return null;
  }
  const findCells = (tableId, rowIds) => {
    const rows = f.get([tableId], allDisplayValues);
    return f.map(
      id =>
        f.head(
          f.get(
            "values",
            f.find(element => element.id === id, rows)
          )
        ),
      rowIds
    );
  };
  const currentDisplayValues = f.get([tableId], allDisplayValues);
  return f.map(row => {
    return {
      id: row.id,
      values: mapIndexed((cell, index) => {
        if (columns[index].kind !== "link") {
          return cell;
        }
        const { tableId, rowIds } = cell;
        return findCells(tableId, rowIds);
      }, row.values)
    };
  }, currentDisplayValues);
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

//if there was a location: "after", this would look way better
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

const createLinkOrderRequest = data =>
  f.compose(
    buildRequestParam(data),
    getShiftedElement,
    calcDistanceTable
  )(data);

export { combineDisplayValuesWithLinks, createLinkOrderRequest };

export default identifyUniqueLinkedRows;
