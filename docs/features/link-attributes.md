# Link attributes

A link — the connection between one row and one row in another table — can carry values of its
own. The frontend reads those values, folds them into the label it shows for that one link,
and lets a user edit them from the link overlay and the detail entity view.

The definitions come from the backend and are read-only here. There is no UI for creating or
maintaining them.

> **What this document owns.** How the frontend consumes, renders and edits link attributes:
> the editing flow, label formatting, markup rules, filtering and sorting, revision history,
> undo/redo, and how a change reaches every copy of a display value. The wire contract —
> definition shape, endpoint semantics, `null` versus absent, definition migration, rollout
> gates — belongs to the backend and is documented there, in its own
> `docs/features/link-attributes.md`. When the two disagree, that document is right about the
> contract and this one is right about frontend behaviour.

Vocabulary is fixed in [CONTEXT.md](../../CONTEXT.md) and, for the shared terms, in the
backend repository's own `CONTEXT.md`. In particular
_link label_ means the linked row's identifier composed through the format pattern with one
link's own attribute values, and _attribute_ unqualified means nothing at all — there are
three of them.

---

## Part 1 — Using link attributes

### Editing

Clicking a linked entry opens a popover anchored to it, with one input per attribute
definition. It is reachable from two places: the **link overlay** and the **detail entity
view**. Grid cells are display-only.

The popover keeps a local draft. It writes when it closes — a click outside it, or `Enter`.
`Escape` closes it without writing, so discarding a draft costs nothing because nothing was
sent. If the write fails, a toast appears and the optimistically applied value stays on
screen rather than snapping back to a value the server may already have taken.

Editing is offered only for an entry that is genuinely linked, not archived, not hidden by
row permissions, on a column that actually declares attributes.

### What the frontend assumes from the backend

That a link column carries its definitions as `linkAttributes`, that each link's values arrive
positionally alongside them, and that the dedicated endpoint accepts exactly one value per
definition:

```json
{ "id": 2, "value": "Screwdriver", "attributes": [75] }
```

`attributes[0]` is the value of `linkAttributes[0]` — the definition list at the same index is
the only thing that says what a value means, and the client keeps it that way rather than
normalising into a name-keyed object; see
[ADR 0006](../adr/0006-link-attribute-values-stay-positional-in-the-client.md). A definition is
also not a column, and is not made to look like one here either
([ADR 0005](../adr/0005-link-attributes-are-not-treated-as-columns.md)). The full contract,
including what `null` means versus an absent key and what happens when a definition changes,
lives in the backend's `docs/features/link-attributes.md`.

### Where the two sides do not line up exactly

Reading both documents together, these are the seams worth knowing about. None of them is a
defect today; each is a place where the two implementations make different assumptions.

- **The backend's rollout gates are stricter than this UI.** It currently allows at most one
  definition per link column and rejects `multilanguage: true` outright. The popover renders
  _every_ definition it is given and has a branch for multilanguage attributes, so it is
  forward-compatible with both gates being lifted — but neither path can be exercised through
  a real backend today. See the caveat under [Known limitations](#known-limitations) before
  lifting the multilanguage gate.
- **The frontend's placeholder syntax is more permissive.** It tolerates whitespace inside the
  braces (`{{ value }}`) where the backend's pattern parser does not, and it resolves an
  unknown placeholder to an empty string instead of rejecting it. Since the backend validates
  a pattern against the definitions when the pattern is written, a pattern that reaches the
  frontend has already passed the stricter check — the leniency is unreachable in practice
  rather than wrong.
- **An unknown placeholder renders differently than in concat and group columns.** There,
  `format` in `getDisplayValue.js` turns a leftover placeholder into `_`. Link labels render
  it as nothing. Deliberate: `_` marks _a value that is missing_, and an unknown attribute
  name is not a missing value.
- **A newly added link cannot carry attributes at creation time.** Toggling a link on sends a
  bare id, so its attributes are set afterwards through the dedicated endpoint. This also
  keeps the frontend out of the failure the backend documents for appending a link that
  already exists — which is, in hindsight, the same failure the long-standing workaround in
  `calculateCellUpdate` was written for ("Backend fails sometimes on a patch with the first
  link").
- **Reordering definitions is not offered.** The backend documents that reordering
  reinterprets every stored value against its new slot, so it is not a cosmetic operation.
  There is no UI for it, and no accidental way to trigger one — see
  [ADR 0006](../adr/0006-link-attribute-values-stay-positional-in-the-client.md).
- **`linkId` in the attributes route is the linked row's id**, not the id of a link relation.
  The backend documents that trap where the route is defined; it is repeated here only so that
  nobody re-derives it from the name.

---

## Part 2 — How it works

### Editing one link

`LinkItem` renders the entry and opens `LinkAttributesPopover`. Each definition gets the input
its kind calls for, and the popover converts in both directions — `toAttributeInputValue` on
the way in, `parseAttributeInput` on the way out:

| kind                       | input                                             | draft value                     | stored value                                                     |
| -------------------------- | ------------------------------------------------- | ------------------------------- | ---------------------------------------------------------------- |
| `text`                     | text field                                        | the string, `""` when unset     | `null` when blank, otherwise the string (a literal `0` survives) |
| `integer`                  | number field, no decimals                         | the number, `""` when unset     | parsed and rounded, `null` when unparseable                      |
| `numeric`                  | number field, `decimalDigits` from the definition | the number, `""` when unset     | parsed, `null` when unparseable                                  |
| `boolean`                  | toggle                                            | `true` only for a stored `true` | `true` or `false`, never absent                                  |
| `date`                     | calendar, no free-text entry                      | a moment, or `null`             | server date format, or `null`                                    |
| `datetime`                 | calendar with time                                | a moment, or `null`             | server datetime format, or `null`                                |
| any, `multilanguage: true` | disabled field with a hint                        | —                               | —                                                                |

The write goes through `changeLinkAttributes` in `src/app/redux/actions/cellActions.js`, not
through the generic cell write, because it needs the response body: the server normalises what
it stores (a datetime becomes UTC), and that normalised value has to win over the optimistic
one. `buildAttributesPayload` pads the draft to exactly one value per definition. The
optimistic value is applied before the request goes out and rolled back if it fails; if the
response is not a value array the optimistic value is kept and a warning logged, because
adopting a missing value would blank the link until the next reload.

Two guards inside the popover are load-bearing: it only writes when the draft is actually
dirty, and a closing flag keeps an outside click and a keypress from committing twice.
`Enter` and `Escape` stop propagating, or the surrounding overlay would close along with the
popover.

This is also where `useOutsideClick` had to change. It now asks `event.composedPath()` whether
the click happened inside the popover, instead of asking the container whether it still
contains `event.target`. A widget that rebuilds its own DOM synchronously while handling the
click — the calendar switching from days to months is the case that surfaced it — detaches
that target before the document-level listener runs, and the popover closed on a click that
was actually inside it. The path is captured when the event is dispatched and stays accurate.
Every `outsideClickEffect` consumer benefits, not just this one.

### Link labels

A label is built per link. `formatLinkLabel` substitutes two placeholder forms — the linked
row's identifier, and one attribute addressed by name. The name is resolved to its index in
the definition list, and the value is read from that index of the link's own array.

Formatting happens only when the column has both definitions _and_ a pattern. Requiring both
means a leftover pattern on a column without definitions cannot blank a label, and vice versa.
Union tables resolve through their origin column, the same way `getDisplayValue` does.

How a value renders depends on its kind:

| kind                         | rendering                                                                                                              |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `boolean`                    | `true` renders the definition's display name, falling back to its name; anything else renders nothing                  |
| `date`                       | day-month-year, in the user-facing format                                                                              |
| `datetime`                   | day-month-year plus time, in the browser's zone                                                                        |
| `numeric`, `integer`, `text` | the plain value — no locale, no thousands separator, and no rounding to `decimalDigits`, which only affects the editor |

A missing value renders as `_`, except for booleans, which render as nothing — an unticked box
is not a gap. If neither the identifier nor any attribute produced anything real, the whole
label is empty rather than a pattern full of underscores.

Two traps are worth stating outright. Emptiness is tested with a dedicated helper and never
with `f.isEmpty`, because in lodash/fp both `0` and `false` are empty and a stored zero would
silently vanish. And a multilanguage value is resolved leniently rather than through
`retrieveTranslation`, which validates its input and throws on the plain scalars that
non-multilanguage attributes hold.

Taxonomy links are handed back untouched: their display value is an array of path labels, and
composing a path through a pattern is out of scope.

Labels are applied where the individual link is known — `applyLinkAttributeFormat` in
`src/app/helpers/getDisplayValue.js`, and from there the display-value worker, the row
filters, the overlay cache and the history diff. Never in the shared cache; see
[ADR 0001](../adr/0001-attribute-free-link-display-value-cache.md).

### Emphasis markup

A pattern may contain `<em>`, and nothing else. `FormattedLabel.tsx` parses the text into
React elements: a bare opening or closing `em` becomes structure, and every other tag, an `em`
carrying attributes, and any stray or mismatched end tag stays literal text that React escapes
on render. There is no `dangerouslySetInnerHTML` in this path, so a pattern cannot inject
markup by construction — see [ADR 0002](../adr/0002-em-only-markup-parsed-to-react-nodes.md).

An emphasised span renders as a filled badge, so an empty one would show up as a stray
coloured box — exactly what a pattern produces when the attribute it wraps has no value. Empty
emphasis is therefore pruned, whitespace counting as empty.

The markup survives in three places only: the grid's link chip, the entries in the link
overlay and entity view, and the revision-history diff. Everywhere else the label is reduced
to plain text with `stripFormattingTags` — identifier cells, overlay titles, `title`
attributes, tooltips, and the preview components.

### Filtering, sorting and search

Filters and sorting share their accessors in `src/app/RowFilters/index.js`, so both behave
identically:

| accessor                                   | columns                                   | markup                                   |
| ------------------------------------------ | ----------------------------------------- | ---------------------------------------- |
| `retrieveLinkDisplayValue`                 | link                                      | composes the label per link, then strips |
| `retrieveConcatValue`                      | concat                                    | always strips                            |
| `retrieveDisplayValue`                     | text-ish kinds, and the any-column filter | strips only for concat and group         |
| `retrieveRawValue`, `retrieveBooleanValue` | boolean, date, datetime, integer, numeric | reads stored values, nothing to strip    |

Link columns have to compose before they compare, because the shared cache holds identifiers
rather than labels — filtering against the cache would match text the cell never shows.

Stripping is deliberately limited to link, concat and group. Those three can end up holding a
label that came out of a pattern. In a plain text column a typed `<em>` is the user's own
content, and removing it before comparing would make a search for it fail.

The link overlay keeps two labels per entry: one with markup for rendering, one stripped for
its search box and its alphabetical sort. Candidates that are not linked yet fall back to the
target row's plain identifier — they have no link, so composing one would only produce
underscores.

### Writing a whole link cell value

Replacing a link cell's value makes the server delete and recreate every link in it, so an
entry sent as a bare id comes back without its attributes. `calculateCellUpdate` therefore
reads the old value and sends `{id, attributes}` per entry, preferring attributes already on
the incoming entry — see
[ADR 0003](../adr/0003-read-modify-write-on-full-link-cell-writes.md). Attachments and link
columns without definitions are untouched and keep sending bare ids.

### Undo and redo

Undo and redo replay through the generic cell write, which decides what request to send by
comparing the old and new value. That decision is a chain, and **its order is the invariant to
protect**:

1. same ids _and_ same attributes — nothing to do
2. same ids — an attribute update
3. otherwise, a reorder if every id is still present
4. otherwise, a replacement or a single toggle

An attribute-only change leaves every id in place _and in order_, which is exactly the shape
the reorder check looks for. Moving the attribute comparison below it would send a reorder
request instead of the attribute update. And before attributes existed, identical ids meant
"nothing to do" outright, which is what made undo of an attribute change a silent no-op.

The attribute update also has to send what the target state actually holds, including a `null`
for a slot that state never had. The read-modify-write path above would instead fall back to
the old value for that slot — during an undo, precisely the value being undone.

### Revision history

An attribute change leaves both row ids untouched, so comparing revisions by id alone filed it
as unchanged. The differ now partitions the links that appear in both revisions by whether
their attributes differ, and emits each changed one as a deletion and an addition. Each side
is labelled with its own revision's attributes — otherwise the pair would render as two
identical lines.

Two consequences in `LinkDiff.jsx`: a link's id is no longer a unique key, since the same id
appears on both the removed and the added line, and the per-line hover state moved into its own
component because the number of lines now varies per revision — hooks called inside the map
would have tied React's hook order to that count.

---

## Known limitations

1. **Saving one attribute would flatten a multilanguage neighbour.** The popover converts
   every definition on commit, multilanguage ones included, and their draft value has already
   been reduced to the current langtag's scalar. Saving any attribute would therefore write
   that scalar over the whole language object. **Latent, not live:** the backend rejects
   multilanguage definitions today, so no such attribute can exist. This has to be fixed
   before that gate is lifted.
2. **Edit permission is not checked on the client.** The flag that would carry it defaults to
   permitting the edit and is never passed by either call site; the entity view enables the
   popover unconditionally, and the list computes cell-level permission and row lock but does
   not forward them. Enforcement is entirely server-side.
3. **The undo queue records the optimistic value**, not the normalised one the server returned,
   so a redo replays the pre-normalisation string. Harmless while the server normalises again
   on every write, but store and queue can disagree.
4. **A failed backlink refresh surfaces as a save error.** The error handler around the write
   also covers the follow-up request, so a toast can claim the save failed when it succeeded.
5. **Editing exists only in the link overlay and the detail entity view.** Grid cells display
   labels but offer no way to change them.
6. **The link column type carrying these fields is declared but unused**; the runtime code
   works against loosely typed columns throughout.

## Where this is tested

Formatting and per-kind conversion in `src/app/helpers/linkAttributes.test.ts`, markup parsing
in `src/app/components/helperComponents/FormattedLabel.test.ts`, per-link display values in
`src/app/helpers/getDisplayValue.test.js` and `src/app/helpers/linkHelper.test.js`, the
popover's commit and discard behaviour in
`src/app/components/cells/link/LinkAttributesPopover.test.jsx`, the request the store builds in
`src/app/redux/actions/cellActions.test.js` and
`src/app/redux/actions/linkAttributes.store.test.js`, filtering in
`src/app/RowFilters/index.test.js`, and the differ in
`src/app/components/history/differ.test.js`.
