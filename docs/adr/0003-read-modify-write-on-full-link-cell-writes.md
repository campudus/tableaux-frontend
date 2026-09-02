# A full link cell write re-sends the attributes it read from the old value

Writing a link cell's whole value has always sent a list of ids, which is all the server needs
to know which rows to connect. With link attributes that is no longer sufficient: replacing a
cell value makes the server delete and recreate every link in it, and a link sent as a bare id
is recreated without the values that hung off it. **`calculateCellUpdate` therefore reads the
current cell value and sends `{id, attributes}` per entry**, preferring attributes present on
the incoming entry and falling back to what was stored for that id.

The alternative was to leave the write path alone and treat attribute loss as the price of
reordering or replacing links — or to route every such change through the dedicated attributes
endpoint afterwards, re-applying what was just destroyed. The first is data loss on an
operation the user does not associate with attributes at all; the second turns one request into
one plus N and has a window in which the values are gone. Reading them back from the value
already in the store costs nothing, because that value is what the cell is rendering from
anyway. It applies only to link columns that actually declare attributes: attachments and plain
link columns keep sending bare ids, so nothing changes for them.

Two consequences are worth keeping in view. An entry with no attributes anywhere is still sent
as a bare id rather than with an explicit empty array, because the backend distinguishes
"nothing stored" from "cleared" and the frontend must not turn one into the other. And undo and
redo cannot use this path: they replay through the same generic write, but an attribute-only
change has to send exactly what the target revision held, including a `null` for a slot that
revision never had — where this read-modify-write would fall back to the old value, which
during an undo is precisely the value being undone. That is why there is a second, narrower
action for it, and why the check for it sits **before** the reorder check in the chain: an
attribute-only change leaves every id in place _and in order_, which is exactly the shape a
reorder has. Swapping those two branches sends a reorder request and silently drops the
attribute update.
