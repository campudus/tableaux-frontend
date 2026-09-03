# Link attributes are not treated as columns in the client either

A link attribute definition carries a name, kind, multilanguage flag and display info — very
nearly a column definition. The backend decided not to make it one: no id, no ordering, no row
in the column table, addressed only by name (backend `docs/adr/0006-link-attributes-are-not-columns.md`).
The frontend could have wrapped one in a column-shaped object at the boundary and reused
existing machinery — per-kind editor, sorting, filtering, permissions, history renderer. **We
didn't. A link attribute stays what the API says it is, with its own small editing surface.**

Faking a column means a synthetic id to key React by and address it in the store — one that
would have to survive a rename, which the backend explicitly does not guarantee (a rename is
just a slot whose name changed). Everything downstream would be built on an id the server never
issued. The reusable parts don't fit either: cell editors write through the cell endpoint, which
can't update an existing link's attributes; sorting/filtering work off display values, and an
attribute has none of its own, only its contribution to a link label; permissions are per
column, and there's no column here to hang them on.

Cost: a small amount of duplication, worth naming so it isn't mistaken for an oversight.
`LinkAttributesPopover` maps kinds to inputs itself instead of reusing edit cells, and
`toAttributeInputValue`/`parseAttributeInput` are a second, smaller conversion layer beside the
cells' own. In exchange, an attribute can't be sorted or filtered on directly, doesn't appear in
the column list, and shows up in revision history inside the link diff rather than as its own
change — all following from the API, not gained by pretending otherwise.
