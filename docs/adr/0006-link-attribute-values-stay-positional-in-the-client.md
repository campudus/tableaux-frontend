# Link attribute values stay positional in the client

A link carries its attribute values as a bare array, bound to the column's definition list by
index: `attributes[i]` belongs to `linkAttributes[i]`, and nothing in the value array says
which attribute it is. The backend chose position over a name-keyed object because its
migration diffs definitions by slot, which is what makes a rename free (recorded in
the backend repository as `docs/adr/0007-link-attribute-values-are-positional.md`).
The client was free to decide otherwise for its own state — normalise into `{name: value}` on
read and convert back on write, so that the rest of the code could stop counting. **We kept the
array as it arrives, and index by position everywhere.**

Normalising would have put a translation layer between the store and the wire, and that layer
can disagree with the server in ways nothing detects. It has to be applied to every path that
touches a link value, not just the editing one: the optimistic update, the rollback, the
read-modify-write on a full cell write, the undo comparison, the history differ, and the
display path that composes a label. Miss one and a link ends up holding values in the other
shape, which does not fail — it silently reads the wrong attribute, or writes a well-formed
array whose entries have moved. Positional arrays are also what the endpoint demands (exactly
one value per definition, a length mismatch is rejected), so a normalised store would have to
rebuild the exact array on every write anyway.

Names are resolved exactly once, and only where a name genuinely appears: a
`{{attributes.<name>}}` placeholder in a format pattern is looked up in the definition list to
find its **index**, and the value is then read from that index of the link's array. Everything
else counts. The consequences are that `buildAttributesPayload` has to pad the draft to exactly
one entry per definition, that anything preserving attributes across a write must carry the
array whole rather than picking entries out of it, and that reordering definitions is not
something this UI offers — the backend documents that a reorder reinterprets every stored value
against its new slot, so it is not a cosmetic operation and must not be reachable by accident.
