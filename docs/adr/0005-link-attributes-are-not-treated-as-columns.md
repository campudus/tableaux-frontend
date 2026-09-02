# Link attributes are not treated as columns in the client either

A link attribute definition carries a name, a kind, a multilanguage flag and display info,
which is very nearly a column definition. The backend decided not to make it one — it has no
id, no ordering and no row in the column table, and it is addressed only by its name (recorded
in the backend repository as `docs/adr/0006-link-attributes-are-not-columns.md`).
The frontend could still have wrapped one in a column-shaped object at the boundary and reused
the machinery it already has for cells: an editor per kind, sorting, filtering, permissions,
the history renderer. **We did not. A link attribute stays what the API says it is, and gets
its own small editing surface instead.**

Faking a column would have meant giving it a synthetic id to key React by and to address it in
the store, and that id would have to survive a rename — which the backend explicitly does not
guarantee, since a rename is just a slot whose name changed. Everything downstream of a column
id would then be built on an identifier the server never issued. The parts that look
attractive to reuse also turn out not to fit: cell editors write through the cell endpoint,
which is the one path that cannot update an existing link's attributes; sorting and filtering
work off display values, and an attribute has none of its own, only the contribution it makes
to a link label; permissions are per column, and there is no column here to hang them on.

The cost is a small amount of duplication, and it is worth naming so nobody mistakes it for an
oversight. `LinkAttributesPopover` maps kinds to inputs itself rather than reusing the edit
cells, and `toAttributeInputValue` / `parseAttributeInput` are a second, smaller conversion
layer beside the one the cells use. In exchange, an attribute cannot be sorted or filtered on
directly, does not appear in the column list, and shows up in the revision history inside the
link diff rather than as a change of its own — all of which follow from the API and would have
had to be faked, not gained, by pretending otherwise.
