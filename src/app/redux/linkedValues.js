import f from "lodash/fp";

import { ColumnKinds } from "../constants/TableauxConstants";
import { makeRequest } from "../helpers/apiHelper";
import route from "../helpers/apiRoutes";
import {
  buildOriginColumnLookup,
  getConcatOrigin
} from "../helpers/columnHelper";
import getDisplayValue from "../helpers/getDisplayValue";
import ActionTypes from "./actionTypes";

const { LINKED_VALUES_UPDATED } = ActionTypes;

// A link cell does not only store the id of its target row, it stores a copy of
// that row's identifier value -- the label is built from that copy. And if the
// target's identifier is itself a link, the copy contains another copy:
//
//   variant.model = [{ id: 7, value: <the model's identifier> }]
//                                     = [[{ id: 3, value: "Tektro" }], "BR-R01"]
//                                          ^ the manufacturer's name
//
// So renaming the manufacturer has to reach a value nested two levels deep in a
// row of a third table. Every one of those copies is already in the store,
// which is why nothing here needs a request: the functions below walk the
// column tree and the value tree in parallel -- the same recursion
// getDisplayValue does -- and replace the copies wherever they sit. A single
// pass covers every level, because the deeper level is part of the same value.

// The nesting the backend sends ends at the identifier leaf column. A cyclic
// identifier definition must not hang the walk regardless.
const MAX_DEPTH = 12;

const isLink = column => column.kind === ColumnKinds.link;

// Members of a concat or group column, empty for everything else.
const membersOf = column => column.concats || column.groups || [];

// A union table's columns carry the origin table's definition in `originColumn`.
const resolveColumn = column => column && (column.originColumn || column);

const replaceAt = (values, index, value) => {
  const next = [...values];
  next[index] = value;
  return next;
};

// Maps over an array but returns the SAME array when no element changed.
// Everything below relies on this: an untouched value is recognised by
// identity, which is what keeps unaffected rows out of the payload -- and their
// objects out of the re-render.
const mapKeepingIdentity = (values, fn) => {
  if (!Array.isArray(values)) {
    return values;
  }
  let changed = false;
  const mapped = values.map((value, index) => {
    const next = fn(value, index);
    changed = changed || next !== value;
    return next;
  });

  return changed ? mapped : values;
};

// Replaces every copy of target.value that belongs to target's row, at any
// depth. target: { tableId, rowId, value }
export const patchLinkedValue = (column, value, target, depth = 0) => {
  const resolved = resolveColumn(column);
  if (!resolved || depth > MAX_DEPTH) {
    return value;
  }

  if (isLink(resolved)) {
    return mapKeepingIdentity(value, entry => {
      if (!entry || typeof entry !== "object") {
        return entry;
      }
      const isTargetRow =
        resolved.toTable === target.tableId && entry.id === target.rowId;

      if (isTargetRow) {
        // Already equal: keep the reference. This is what makes a change to a
        // column that is nobody's identifier produce no payload at all.
        return f.isEqual(entry.value, target.value)
          ? entry
          : { ...entry, value: target.value };
      }

      // Not the changed row, but its identifier may contain a copy.
      const patched = patchLinkedValue(
        resolved.toColumn,
        entry.value,
        target,
        depth + 1
      );

      return patched === entry.value ? entry : { ...entry, value: patched };
    });
  }

  const members = membersOf(resolved);

  return members.length === 0
    ? value
    : mapKeepingIdentity(value, (memberValue, index) =>
        patchLinkedValue(members[index], memberValue, target, depth + 1)
      );
};

// Can a value of this column hold a link into `tableId` at any depth? Answered
// per column, so the row scan only visits positions that can match at all.
export const columnCanHold = (column, tableId, depth = 0) => {
  const resolved = resolveColumn(column);
  if (!resolved || depth > MAX_DEPTH) {
    return false;
  }

  return isLink(resolved)
    ? resolved.toTable === tableId ||
        columnCanHold(resolved.toColumn, tableId, depth + 1)
    : membersOf(resolved).some(member =>
        columnCanHold(member, tableId, depth + 1)
      );
};

// Which column of `tableId` the links pointing at it embed -- its identifier.
// Read from a link column rather than guessed from the target table's own
// column list, so nothing has to assume where its identifier sits.
const findEmbeddedColumn = (column, tableId, depth = 0) => {
  const resolved = resolveColumn(column);
  if (!resolved || depth > MAX_DEPTH) {
    return null;
  }

  if (isLink(resolved)) {
    return resolved.toTable === tableId
      ? resolved.toColumn
      : findEmbeddedColumn(resolved.toColumn, tableId, depth + 1);
  }

  return membersOf(resolved).reduce(
    (found, member) => found || findEmbeddedColumn(member, tableId, depth + 1),
    null
  );
};

const columnsOf = (state, tableId) => state.columns?.[tableId]?.data ?? [];

const rowsOf = (state, tableId) => state.rows?.[tableId]?.data ?? [];

const tableOf = (state, tableId) =>
  state.tables?.data?.[tableId] ?? { id: tableId };

const loadedTableIds = state => Object.keys(state.rows ?? {}).map(Number);

const findEmbeddedColumnOfTable = (state, tableId) =>
  loadedTableIds(state).reduce(
    (found, loadedTableId) =>
      found ||
      columnsOf(state, loadedTableId).reduce(
        (inTable, column) => inTable || findEmbeddedColumn(column, tableId),
        null
      ),
    null
  );

// The identifier value of (tableId, rowId) as the store holds it right now.
//
// A concat identifier is assembled from its member columns rather than read
// from the row's stored concat value. The stored copy is in line by the time
// this runs (applyDependentValues in reducers/rows.js patches it along with the
// cell write), but assembling makes that irrelevant: the members are the source
// of truth either way, and this stays correct no matter when it is called.
const identifierValueOf = (state, tableId, rowId, embeddedColumn) => {
  const columns = columnsOf(state, tableId);
  const row = rowsOf(state, tableId).find(row => row.id === rowId);

  if (!row) {
    return undefined;
  }

  const indexOf = column => columns.findIndex(({ id }) => id === column.id);
  const memberIndices = membersOf(resolveColumn(embeddedColumn)).map(indexOf);

  if (memberIndices.length > 0 && !memberIndices.includes(-1)) {
    return memberIndices.map(index => row.values[index]);
  }

  const columnIndex = indexOf(embeddedColumn);

  return columnIndex === -1 ? undefined : row.values[columnIndex];
};

// A union table's columns depend on the row's origin table -- resolved exactly
// like the display value worker does it (see reducers/worker.js).
const columnForRow = (column, row, tableId, getOriginColumn) =>
  column.kind === ColumnKinds.concat
    ? getConcatOrigin(tableId, column, row.tableId || tableId)
    : getOriginColumn(column.id, row.tableId) || column;

// One row's patched values, or null when it holds no copy of the changed row.
// Only the positions that actually changed get a new display value: that is
// what keeps the pathological case cheap -- a target row linked from 10.000
// rows costs one or two operations per row instead of a full recomputation.
const patchRow = (
  row,
  { columns, columnIndices, tableId, getOriginColumn, target }
) => {
  const displayValueUpdates = {};
  let values = row.values;

  columnIndices.forEach(index => {
    const column = columnForRow(columns[index], row, tableId, getOriginColumn);
    const patched = patchLinkedValue(column, values[index], target);

    if (patched !== values[index]) {
      values = replaceAt(values, index, patched);
      displayValueUpdates[index] = getDisplayValue(column, patched);
    }
  });

  return values === row.values
    ? null
    : { id: row.id, values, displayValueUpdates };
};

const patchTable = (state, tableId, target) => {
  const columns = columnsOf(state, tableId);
  const rows = rowsOf(state, tableId);
  const columnIndices = columns.flatMap((column, index) =>
    columnCanHold(column, target.tableId) ? [index] : []
  );

  if (rows.length === 0 || columnIndices.length === 0) {
    return null;
  }

  const getOriginColumn = buildOriginColumnLookup(
    tableOf(state, tableId),
    columns
  );
  const patchedRows = rows
    .map(row =>
      patchRow(row, {
        columns,
        columnIndices,
        tableId,
        getOriginColumn,
        target
      })
    )
    .filter(Boolean);

  return patchedRows.length === 0 ? null : { tableId, rows: patchedRows };
};

// Everything in the store that shows something of (tableId, rowId), with that
// row's current identifier value pushed into it:
//
//   [{ tableId, rows: [{ id, values, displayValueUpdates: { [columnIdx]: dv } }] }]
export const collectLinkedValueUpdates = (state, { tableId, rowId }) => {
  const embeddedColumn = findEmbeddedColumnOfTable(state, tableId);
  if (!embeddedColumn) {
    return [];
  }

  const value = identifierValueOf(state, tableId, rowId, embeddedColumn);

  // The row is not in the store, or its identifier column is not among the
  // loaded ones. Distributing that would replace readable labels with empty
  // ones, so leave every copy alone instead.
  if (value === undefined) {
    return [];
  }

  const target = { tableId, rowId, value };

  return loadedTableIds(state)
    .map(loadedTableId => patchTable(state, loadedTableId, target))
    .filter(Boolean);
};

// Pushes the current identifier value of (tableId, rowId) into every copy the
// store holds. Direction-agnostic and idempotent -- it distributes whatever the
// row holds right now, which is why the rollback path can simply call it again.
export const propagateLinkedValues = ({ tableId, rowId }) => (
  dispatch,
  getState
) => {
  const updates = collectLinkedValueUpdates(getState(), { tableId, rowId });

  if (updates.length > 0) {
    dispatch({ type: LINKED_VALUES_UPDATED, updates });
  }
};

// A refetched row can differ anywhere, so all of its display values are
// recomputed.
const allDisplayValues = (row, columns, tableId, getOriginColumn) =>
  columns.reduce((updates, column, index) => {
    const resolved = columnForRow(column, row, tableId, getOriginColumn);
    updates[index] = getDisplayValue(resolved, row.values[index]);
    return updates;
  }, {});

// Refetches single rows. Used for the one thing that cannot be derived
// locally: a link change alters the same edge on the other side, and the
// frontend cannot tell which column of the target table mirrors it (`toColumn`
// points at the identifier, not at the backlink). One request per changed edge
// -- not one per row that shows the change.
export const refreshRows = (tableId, rowIds) => async (dispatch, getState) => {
  const state = getState();
  const columns = columnsOf(state, tableId);
  const storedIds = new Set(rowsOf(state, tableId).map(row => row.id));
  const wantedIds = [...new Set(rowIds)].filter(rowId => storedIds.has(rowId));

  if (columns.length === 0 || wantedIds.length === 0) {
    return;
  }

  const freshRows = await Promise.all(
    wantedIds.map(rowId =>
      makeRequest({ apiRoute: route.toRow({ tableId, rowId }) })
    )
  );
  const getOriginColumn = buildOriginColumnLookup(
    tableOf(state, tableId),
    columns
  );

  dispatch({
    type: LINKED_VALUES_UPDATED,
    updates: [
      {
        tableId,
        rows: freshRows.map(row => ({
          id: row.id,
          values: row.values,
          displayValueUpdates: allDisplayValues(
            row,
            columns,
            tableId,
            getOriginColumn
          )
        }))
      }
    ]
  });

  // A refetched row may have a new identifier itself -- its backlink column can
  // be part of it -- so its own copies elsewhere have to follow. Local again,
  // no further request.
  freshRows.forEach(row =>
    dispatch(propagateLinkedValues({ tableId, rowId: row.id }))
  );
};

// The rows on the other side of the edges this change added or removed. A
// reorder changes no edge and therefore fetches nothing.
export const refreshBacklinks = ({
  column,
  oldValue,
  newValue
}) => dispatch => {
  if (!column || !isLink(column)) {
    return Promise.resolve();
  }

  const idsOf = value =>
    Array.isArray(value) ? value.map(entry => entry.id) : [];
  const oldIds = idsOf(oldValue);
  const newIds = idsOf(newValue);
  const changedIds = [
    ...oldIds.filter(id => !newIds.includes(id)),
    ...newIds.filter(id => !oldIds.includes(id))
  ];

  return dispatch(refreshRows(column.toTable, changedIds));
};
