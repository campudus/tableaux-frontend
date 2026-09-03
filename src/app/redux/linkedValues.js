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

// Every copy of a changed row's identifier is already in the store, so the
// functions below distribute it by walking the column tree and the value tree
// in parallel instead of refetching.
//
// See docs/architecture/dependent-display-values.md and
// docs/adr/0004-local-propagation-of-dependent-display-values.md.

// Bounds the walk against cyclic identifier definitions.
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

// Returns the SAME array when no element changed. Identity is how everything
// below recognises an untouched value.
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

// Can a value of this column hold a link into `tableId` at any depth?
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
// Read off a link column instead of guessing where the target table's own
// identifier sits.
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

// The identifier value of (tableId, rowId) as the store holds it right now. A
// concat identifier is assembled from its members rather than read from the
// row's stored concat value, so this stays correct whenever it is called.
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
// Only changed positions get a new display value.
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
// row's current identifier pushed into it:
//
//   [{ tableId, rows: [{ id, values, displayValueUpdates: { [columnIdx]: dv } }] }]
export const collectLinkedValueUpdates = (state, { tableId, rowId }) => {
  const embeddedColumn = findEmbeddedColumnOfTable(state, tableId);
  if (!embeddedColumn) {
    return [];
  }

  const value = identifierValueOf(state, tableId, rowId, embeddedColumn);

  // Unloaded row or identifier column: distributing that would replace
  // readable labels with empty ones.
  if (value === undefined) {
    return [];
  }

  const target = { tableId, rowId, value };

  return loadedTableIds(state)
    .map(loadedTableId => patchTable(state, loadedTableId, target))
    .filter(Boolean);
};

// Pushes the current identifier of (tableId, rowId) into every copy the store
// holds. Idempotent, so the rollback path can simply call it again.
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

// Refetches single rows -- the one thing that cannot be derived locally: a link
// change alters the same edge on the other side, and `toColumn` points at the
// target's identifier, not at its backlink column.
export const refreshRows = (tableId, rowIds) => async (dispatch, getState) => {
  const state = getState();
  const columns = columnsOf(state, tableId);
  const storedIds = new Set(rowsOf(state, tableId).map(row => row.id));
  const wantedIds = [...new Set(rowIds)].filter(rowId => storedIds.has(rowId));

  if (columns.length === 0 || wantedIds.length === 0) {
    return;
  }

  // The write this follows has already succeeded, so a failed refetch leaves a
  // stale label -- it must not surface as a failed save.
  const settled = await Promise.allSettled(
    wantedIds.map(rowId =>
      makeRequest({ apiRoute: route.toRow({ tableId, rowId }) })
    )
  );
  settled
    .filter(result => result.status === "rejected")
    .forEach(result =>
      console.warn("refreshRows: refetch failed", result.reason)
    );
  const freshRows = settled
    .filter(result => result.status === "fulfilled")
    .map(result => result.value);

  if (freshRows.length === 0) {
    return;
  }

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

  // A refetched row's own identifier may have changed -- its backlink column
  // can be part of it -- so its copies elsewhere have to follow.
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
