import f from "lodash/fp";

import { ColumnKinds } from "../constants/TableauxConstants";
import { doto, memoizeWith, merge, when } from "../helpers/functools";
import getDisplayValue from "../helpers/getDisplayValue";

/**
 * @params { tableId, columnId, rowId }
 * @returns [rowIndex, columnIndex, displayValueColumnIndex]
 */
export const idsToIndices = (
  { tableId, columnId, rowId } = {},
  completeState
) => {
  try {
    const rowIdx = f.findIndex(
      row => row.id === rowId,
      f.prop(["rows", tableId, "data"], completeState)
    );
    const columnIdx = f.findIndex(
      col => col.id === columnId,
      f.prop(["columns", tableId, "data"], completeState)
    );
    const displayValueColumnIdx = f.findIndex(
      row => row.id === rowId,
      f.prop(["tableView", "displayValues", tableId], completeState)
    );
    return [rowIdx, columnIdx, displayValueColumnIdx];
  } catch (err) {
    console.error(
      "Redux helper: could not calculate indices for table",
      tableId,
      "row",
      rowId,
      "column",
      columnId,
      err
    );
    return [-1, -1, -1];
  }
};

export const tableColumnKey = arg => {
  const [tableId, columnId] = f.props(["tableId", ["column", "id"]], arg);
  return f.every(f.isNil, [tableId, columnId])
    ? null
    : `${tableId}-${columnId}`;
};

export const isGroupMember = memoizeWith(
  tableColumnKey,
  ({ tableId, column, completeState }) => {
    const columns = completeState.columns[tableId].data;
    const groupMemberIds = doto(
      columns,
      f.map(
        f.flow(
          f.prop("groups"),
          f.map("id")
        )
      ),
      f.reject(f.isEmpty),
      f.flatten
    );
    return f.contains(column.id, groupMemberIds);
  }
);

export const getLookupMap = memoizeWith(
  f.prop("tableId"),
  ({ tableId, completeState }) => {
    const columns = completeState.columns[tableId].data;

    // column[] -> { [groupColumnId]: groupMemberId[] }
    const groups = doto(
      columns,
      f.groupBy("id"),
      f.mapValues(
        f.flow(
          f.first,
          f.prop("groups"),
          f.map("id")
        )
      ),
      f.pickBy(f.complement(f.isEmpty))
    );

    // { [groupColumnId]: groupMemberId[] } -> { [groupMemberId]: groupColumnId }
    return doto(
      groups,
      f.toPairs,
      f.reduce((theMap, [groupColumnId, groupMemberIds]) => {
        groupMemberIds.forEach(memberId => (theMap[memberId] = groupColumnId));
        return theMap;
      }, {})
    );
  }
);

export const getGroupColumn = (data, completeState) =>
  when(
    f.isString,
    f.parseInt(10),
    f.propOr(null, data.column.id, getLookupMap({ ...data, completeState }))
  );

export const calcConcatValues = (action, completeState) => {
  const { tableId, columnId, column } = action;
  // eslint-disable-next-line no-unused-vars
  const [rowIdx, columnIdx, dvRowIdx] = idsToIndices(action, completeState);
  const columns = completeState.columns[tableId].data;
  const rows = completeState.rows[tableId].data;

  // if we changed an identifier cell and the table has an identifier cell
  if (column.identifier && columns[0].kind === ColumnKinds.concat) {
    const concatColumn = completeState.columns[tableId].data[0];
    const entryIdx = f.findIndex(
      entry => entry.id === columnId,
      concatColumn.concats
    );
    const concatValue = rows[rowIdx].values[0];
    const mergedNewValue = getUpdatedCellValueToSet(action);

    const updatedConcatValue = f.assoc(entryIdx, mergedNewValue, concatValue);

    return {
      rowIdx,
      updatedConcatValue,
      dvRowIdx,
      displayValue: getDisplayValue(concatColumn, updatedConcatValue)
    };
  } else {
    return null;
  }
};

// Conditionally merge cell values for multilang updates
export const getUpdatedCellValueToSet = (
  { column, oldValue, newValue },
  isRollback = false
) => {
  const unmergeableTypes = [ColumnKinds.link, ColumnKinds.attachment];
  const mergeCellValues = () =>
    !column.multilanguage || f.contains(column.kind, unmergeableTypes)
      ? newValue
      : merge(oldValue, newValue);
  return isRollback ? oldValue : mergeCellValues();
};
