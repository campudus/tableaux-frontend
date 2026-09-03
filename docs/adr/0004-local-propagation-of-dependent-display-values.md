# Dependent display values are patched in the store, not refetched

A link cell stores a copy of the linked row's identifier, and when that identifier is itself a
link, the copy contains another copy. Renaming a row therefore has to reach values nested
several levels deep in rows of tables the user may not even be looking at. The previous
`refreshDependentRows` solved this by asking the server: it scanned the stored rows for the
changed id and issued one `GET` per affected row, then replaced the entire store with the
result. **We replaced it with a local walk: every copy is patched in place, in the store,
without a request.**

The observation that makes this possible is that the copies are already in the store — a
rename does not produce information the client lacks, only information it has not yet
distributed. So `patchLinkedValue` walks the column tree and the value tree in parallel, the
same recursion `getDisplayValue` performs, and replaces the copies wherever they sit. The old
approach was quadratic in the wrong dimension: a row linked from ten thousand rows cost ten
thousand requests, and because the whole store was dispatched as a replacement afterwards,
every slice got a fresh identity and effectively everything re-rendered. It also could not be
optimistic, since it only ran once the write had returned. The new one is dispatched before the
response arrives, and `mapKeepingIdentity` preserves the identity of everything it did not
touch, so only genuinely affected rows re-render.

Requests did not disappear entirely, and the remainder is the interesting part: the rows on the
other side of links that were _added or removed_ are still refetched, because which column of
the target table mirrors a link is something only the backend knows — `toColumn` points at the
identifier, not at the backlink column. That is one request per changed link rather than per
row that displays it, and a reorder, which changes no link, makes none. The distribution is
direction-agnostic and idempotent, which is what lets the rollback path call the very same
function instead of computing an inverse. The costs are that the walk has to be bounded against
cyclic identifier definitions, that it must decline to distribute when the changed row or its
identifier column is not loaded (an empty label would otherwise overwrite readable ones), and
that the reducer has to return a fresh root identity when it changes anything — the surrounding
reducer compares slices deeply and would otherwise hand back the previous root, and nothing
would re-render at all.
