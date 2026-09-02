# Dependent display values

Renaming a row changes what other rows show. This document describes how that change reaches
every place the old value is displayed, and why almost none of it needs a request.

It is worth reading before touching anything that writes cell values, adds or removes links,
or reduces `LINKED_VALUES_UPDATED`. The work landed alongside
[link attributes](../features/link-attributes.md), which is what forced it, but it applies to
every identifier in the system.

## The problem

A link cell does not only store the id of the row it points at — it stores a copy of that
row's identifier, because that copy is what the label is built from. And when the linked row's
own identifier is a link, the copy contains another copy:

```txt
variant.model = [{ id: 7, value: [ [{ id: 3, value: "Tektro" }], "BR-R01" ] }]
                                     ^ a copy of the manufacturer's name
```

So renaming the manufacturer has to reach a value nested two levels deep in a row of a third
table. The crucial observation: **every one of those copies is already in the store.** Nothing
has to be fetched to know the new value — only found.

## What this replaced

The previous `refreshDependentRows` was a network crawler. For every table depending on the
changed one it scanned the stored rows, and for each row holding the changed id it issued a
`GET` for that row. A row linked from ten thousand rows cost ten thousand requests. It then
mutated a clone of the state in place, recomputed all display values for each refetched row,
recursed into the next level of dependencies, and finally dispatched the whole store as a
replacement — every slice with a fresh identity, so effectively everything re-rendered. And
because it only ran once the write had returned, none of it was optimistic.

`src/app/redux/updateDependentTables.js` kept only `calcColumnDependencies`,
`performRowDeletion` and `propagateRowDelete`. Everything else moved to
`src/app/redux/linkedValues.js`, and the reasoning is stated in that file's header and in
[ADR 0004](../adr/0004-local-propagation-of-dependent-display-values.md).

## How the distribution works

`collectLinkedValueUpdates` takes the changed row, reads its current identifier, and walks the
loaded tables looking for copies of it. `patchTable` and `patchRow` narrow it down to rows and
columns; `patchLinkedValue` walks a column tree and a value tree in parallel — the same
recursion `getDisplayValue` performs — and replaces a copy wherever it sits. Concat and group
columns recurse through their members, so a single pass covers every level, because the deeper
level is part of the same value.

Several details carry more weight than their size suggests:

- **`mapKeepingIdentity` returns the same array when nothing changed.** Everything else builds
  on it: an untouched value is recognised by identity, which is what keeps unaffected rows out
  of the payload and their objects out of the re-render. `patchRow` and `patchTable` return
  `null` on no-op for the same reason, and a copy that already equals the new value keeps its
  reference rather than being rewritten to an equal one.
- **`columnCanHold` pre-filters columns**, so the row scan only visits positions that could
  possibly match.
- **`identifierValueOf` assembles a concat identifier from its member columns** rather than
  reading the stored concat value. That stored copy is only refreshed once the write returns,
  and this runs optimistically — reading it would distribute the value being replaced.
- **`MAX_DEPTH` bounds the walk**, because a cyclic identifier definition must not hang it.
- **A row that is not in the store, or whose identifier column is not loaded, produces no
  updates at all.** Distributing an unknown value would replace readable labels with empty
  ones, so the safe answer is to leave every copy alone.

Only the changed column indices get a recomputed display value. A row linked from ten thousand
rows costs one or two operations per row instead of a full recomputation.

## The action

The result is one `LINKED_VALUES_UPDATED` action carrying, per table, the rows that actually
changed. `applyLinkedValues` in `src/app/redux/reducers/rows.js` applies the values and
`applyLinkedDisplayValues` in `src/app/redux/reducers/tableView.js` merges the display values
per column index, both creating new objects only for what they touched.

One reducer-level requirement is easy to break: the reducer **must** return a new root
identity when it changed anything. The surrounding `omniscentReducer` compares slices deeply
and would otherwise hand back the previous root, and nothing would re-render. An empty payload,
an unknown table and an unknown row all return the very same root, deliberately.

## What still costs a request

Only what cannot be derived locally.

`refreshBacklinks` computes the symmetric difference of the link ids and refetches the rows on
the other side of the links that were **added or removed** — one request per changed link, not
one per row that displays the change. The frontend cannot derive that side: a link change
alters the same connection from the other direction, and which column of the target table
mirrors it is something only the backend knows, because `toColumn` points at the identifier
rather than at the backlink column. A link attribute change refetches the linked row for the
same reason.

Everything else is local: a rename at any depth, a reorder (which changes no link, so the
difference is empty), and any row the store does not hold. A refetched row is itself
propagated afterwards — its backlink column can be part of its own identifier — but that
follow-up needs no further request.

## Idempotence and rollback

`propagateLinkedValues` distributes whatever the row holds _right now_. It is
direction-agnostic and idempotent, which is why the rollback path simply calls it again rather
than computing an inverse. The ordering that makes this work is that the middleware has already
reduced the optimistic value — or the rollback — by the time the propagation runs. A change to
a column that is nobody's identifier produces no payload at all.

## The memoisation fix

The dependency map is memoised, and its key used to be the list of table ids. A table registers
its id while its columns are still loading, at which point the map for it is necessarily empty —
and that incomplete map got cached under exactly the key the fully loaded state produces later,
leaving the dependency map wrong for the rest of the session. The key now counts only tables
whose columns have actually arrived.

## A related fix

`withForeignDisplayValues` applied `connect()` inside its own render, producing a new component
_type_ on every render, which made React unmount and remount the entire subtree. Anything with
state below it was destroyed whenever the row re-rendered — concretely, the open link attribute
popover and its uncommitted draft vanished on a mouse move. `connect()` is now applied once, at
composition time.

## Where this is tested

The walk itself in `src/app/redux/linkedValues.test.js`, including cyclic definitions and the
guarantee that patching a link entry keeps the rest of it. Request counts and exact routes in
`src/app/redux/actions/linkedValues.store.test.js`, which drives a real store with a mocked
request layer. The identity guarantees in
`src/app/redux/reducers/linkedValuesUpdated.test.js`, the index-wise display value merge in
`src/app/redux/reducers/tableView.test.js`, and the memo key in
`src/app/redux/updateDependentTables.test.js`.
