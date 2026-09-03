# Dependent display values

Renaming a row changes what other rows show. This describes how that reaches every place the
old value is displayed, and why almost none of it needs a request.

Read before touching anything that writes cell values, adds/removes links, or reduces
`LINKED_VALUES_UPDATED`. Landed alongside [link attributes](../features/link-attributes.md),
which forced it, but applies to every identifier in the system.

## The problem

A link cell stores a copy of the linked row's identifier, not just its id — that copy is what
the label is built from. When the linked row's own identifier is a link, the copy contains
another copy:

```txt
variant.model = [{ id: 7, value: [ [{ id: 3, value: "Tektro" }], "BR-R01" ] }]
                                     ^ a copy of the manufacturer's name
```

Renaming the manufacturer has to reach a value nested two levels deep in a row of a third
table. Key observation: **every copy is already in the store** — nothing to fetch, only find.

The changed row also holds copies of its own values, in its concat column and every group
column the changed column is a member of. Those need no walk; see
[The row's own dependents](#the-rows-own-dependents).

## What this replaced

`refreshDependentRows` was a network crawler: for every dependent table it scanned stored rows,
issuing one `GET` per row holding the changed id (ten thousand links, ten thousand requests),
then mutated a state clone, recomputed all display values for each refetched row, recursed into
the next dependency level, and dispatched the whole store as a replacement — fresh identity on
every slice, so everything re-rendered. Ran only after the write returned, so never optimistic.

`src/app/redux/updateDependentTables.js` kept only `calcColumnDependencies`,
`performRowDeletion` and `propagateRowDelete`. The rest moved to
`src/app/redux/linkedValues.js` — reasoning in that file's header and in
[ADR 0004](../adr/0004-local-propagation-of-dependent-display-values.md).

## How the distribution works

`collectLinkedValueUpdates` reads the changed row's current identifier and walks loaded tables
for copies of it. `patchTable`/`patchRow` narrow to rows and columns; `patchLinkedValue` walks
a column tree and value tree in parallel — the same recursion `getDisplayValue` performs —
replacing a copy wherever it sits. Concat and group columns recurse through their members, so
one pass covers every level.

Details worth knowing:

- **`mapKeepingIdentity` returns the same array when nothing changed.** An untouched value keeps
  its identity, which keeps unaffected rows out of the payload and re-render. `patchRow`/
  `patchTable` return `null` on no-op for the same reason.
- **`columnCanHold` pre-filters columns** so the row scan only visits positions that could match.
- **`identifierValueOf` assembles a concat identifier from its member columns**, not the stored
  concat value — the members are the source of truth, so this is correct regardless of call
  order.
- **`MAX_DEPTH` bounds the walk** against cyclic identifier definitions.
- **An unloaded row, or one with an unloaded identifier column, produces no update.**
  Distributing an unknown value would replace readable labels with empty ones.

Only changed column indices get a recomputed display value — one or two operations per row
instead of a full recomputation, however many rows are linked.

## The action

One `LINKED_VALUES_UPDATED` action carries, per table, the rows that actually changed.
`applyLinkedValues` (`reducers/rows.js`) applies values, `applyLinkedDisplayValues`
(`reducers/tableView.js`) merges display values per column index — both creating new objects
only for what they touched.

The reducer **must** return a new root identity when it changed anything: `omniscentReducer`
compares slices deeply and otherwise hands back the previous root, and nothing re-renders. An
empty payload, an unknown table, an unknown row — all return the same root, deliberately.

## What still costs a request

Only what cannot be derived locally.

`refreshBacklinks` diffs the link ids and refetches rows on the other side of links **added or
removed** — one request per changed link, not per row displaying the change. The frontend can't
derive that side: `toColumn` points at the identifier, not the backlink column, so only the
backend knows which column mirrors a link. A link attribute change refetches the linked row for
the same reason.

Everything else is local: a rename at any depth, a reorder (no link changes, empty diff), any
row the store doesn't hold. A refetched row is itself propagated afterwards — no further request.

## Idempotence and rollback

`propagateLinkedValues` distributes whatever the row holds _right now_ — direction-agnostic and
idempotent, so rollback just calls it again instead of computing an inverse. This works because
the middleware has already reduced the optimistic value (or the rollback) by the time
propagation runs. A column that is nobody's identifier produces no payload.

## The row's own dependents

The walk never touches them: `columnCanHold` only admits columns holding a link _into_ the
changed table, and a concat of local scalars holds none back to its own. `calcDependentValues`
(`src/app/redux/redux-helpers.js`) handles it instead — cheap, since a concat's/group's value is
an array positional to its `concats`/`groups` members: one index assignment plus one
`getDisplayValue` per dependent column.

Two load-bearing properties:

- **A cell can feed several dependent columns, independently**: the concat at index 0 if
  `identifier`, _and_ every group it's a member of. Used to be either/or — a boolean that was
  both got its group patched and concat skipped, leaving the concat display value and the
  EntityView title (live from `row.values[0]` in `OverlayHeadRowIdentificator`) stale until
  reload.
- **Runs with `CELL_SET_VALUE`/`CELL_ROLLBACK_VALUE`, not `CELL_SAVED_SUCCESSFULLY`** — next to
  the cell's own write, in `setCellValue`/`updateDisplayValue`. Optimistic, and symmetrical: the
  post-response variant it replaced was never undone on rollback.

A dependent column the changed one doesn't appear in, or whose value isn't loaded, is skipped —
`f.assoc(-1, …)` would add a stray `"-1"` property instead.

## The memoisation fixes

Two keys, stable across a state change that should have invalidated them.

The dependency map was keyed on the list of table ids. A table registers its id while columns
still load, so its map is empty — cached under the same key the loaded state produces later,
wrong for the rest of the session. Now counts only tables whose columns have arrived.

`getGroupLookup` (member → group) was keyed on the table id, which never changes — a group
created or edited mid-session stayed invisible. Now keyed on the columns array itself, which
`columns` replaces on `COLUMNS_DATA_LOADED` and `COLUMN_EDIT_SUCCESS`.

## A related fix

`withForeignDisplayValues` applied `connect()` inside its own render, producing a new component
_type_ every render and making React unmount/remount the whole subtree — destroying any state
below it, e.g. an open link attribute popover's uncommitted draft, on every row re-render.
`connect()` is now applied once, at composition time.

## Where this is tested

The walk in `src/app/redux/linkedValues.test.js` (cyclic definitions, partial-entry patching).
Request counts/routes in `src/app/redux/actions/linkedValues.store.test.js` (real store, mocked
requests). Identity guarantees in `src/app/redux/reducers/linkedValuesUpdated.test.js`,
index-wise display value merge in `src/app/redux/reducers/tableView.test.js`, memo key in
`src/app/redux/updateDependentTables.test.js`.

The row's own dependents in `src/app/redux/reducers/dependentValues.test.js` (real store through
`CELL_SET_VALUE`/`CELL_ROLLBACK_VALUE`: identifier-that's-also-group-member, each alone, a group
arriving after the first cell change). The lookup in `src/app/redux/redux-helpers.test.js`.
