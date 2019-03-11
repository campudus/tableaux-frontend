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
    // mapIndexed((element, index)=>{return {...element,}})
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
      id => f.head(f.get("values", f.find(element => element.id === id, rows))),
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
export { combineDisplayValuesWithLinks };

export default identifyUniqueLinkedRows;
