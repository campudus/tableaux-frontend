# A full link cell write re-sends the attributes it read from the old value

Writing a link cell's whole value has always sent a list of ids — all the server needs to
connect rows. With link attributes that's no longer enough: replacing a cell value makes the
server delete and recreate every link in it, and a link sent as a bare id comes back without
its values. **`calculateCellUpdate` now reads the current cell value and sends `{id, attributes}` per entry**, preferring attributes on the incoming entry and falling back to what
was stored for that id.

Alternatives: leave the write path alone and treat attribute loss as the price of
reordering/replacing links, or route every such change through the dedicated attributes
endpoint afterwards. The first is data loss on an operation the user doesn't associate with
attributes at all; the second turns one request into N+1 with a window where the values are
gone. Reading them back from the store costs nothing — that value is what the cell already
renders from. Applies only to link columns with attribute definitions; attachments and plain
link columns keep sending bare ids.

Two consequences. An entry with no attributes anywhere is still sent as a bare id, not an
explicit empty array — the backend distinguishes "nothing stored" from "cleared" and the
frontend must not conflate them. And undo/redo can't use this path: they replay through the
same generic write, but an attribute-only change must send exactly what the target revision
held, including `null` for a slot that revision never had — this read-modify-write would
instead fall back to the old value, which during an undo is precisely the value being undone.
Hence a second, narrower action, checked **before** the reorder check in the chain: an
attribute-only change leaves every id in place _and in order_, the same shape a reorder has.
Swapping those branches sends a reorder request and silently drops the attribute update.
