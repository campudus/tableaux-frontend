# Link attribute values stay positional in the client

A link carries its attribute values as a bare array bound to the column's definition list by
index: `attributes[i]` belongs to `linkAttributes[i]`, nothing in the value array names it. The
backend chose position over a name-keyed object because its migration diffs definitions by
slot, making a rename free (backend `docs/adr/0007-link-attribute-values-are-positional.md`).
The client could have normalised into `{name: value}` on read and converted back on write, so
the rest of the code stops counting. **We kept the array as it arrives, indexing by position
everywhere.**

Normalising puts a translation layer between store and wire that can silently disagree with the
server — and it would have to apply to every path touching a link value: optimistic update,
rollback, read-modify-write on a full cell write, undo comparison, history differ, the label-
composing display path. Miss one and a link ends up in the other shape — doesn't fail loudly, it
silently reads the wrong attribute or writes a well-formed array with entries moved. Positional
arrays are also what the endpoint demands (exactly one value per definition, length mismatch
rejected), so a normalised store would rebuild the array on every write anyway.

Names are resolved exactly once, only where a name genuinely appears: a
`{{attributes.<name>}}` placeholder is looked up in the definition list for its **index**, and
the value read from that index of the link's array. Everything else counts. Consequences:
`buildAttributesPayload` pads the draft to exactly one entry per definition, anything preserving
attributes across a write must carry the array whole rather than picking entries out, and
reordering definitions isn't offered — the backend documents that a reorder reinterprets every
stored value against its new slot, so it must not be reachable by accident.
