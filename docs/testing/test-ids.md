# Test IDs

The browser tests in [grud-test-suite](https://github.com/campudus/grud-test-suite) locate elements
by `data-testid` (`page.getByTestId(...)`). CSS classes and texts change with styling and language,
test IDs are a contract with those tests: don't rename or remove one without adapting the tests.

## Rule

Every `a`, `button`, `input`, `select` and `textarea` (and router `Link`/`NavLink`) needs a
`data-testid`, and so does every other HTML element with `onClick`, `onDoubleClick`, `onMouseDown`, `onMouseUp` or `onContextMenu`
(cells, menu entries, popup backdrops). eslint enforces both (`no-restricted-syntax` in
`eslint.config.js`). Elements with spread props are exempt, the spread may carry the ID. Reusable
components that render such an element take a `testId` prop and pass it on (`Button`,
`ButtonAction`, `NumberInput`, `NewRowButton`, `ContextMenuItem`, `Toggle`, `SearchBar`,
`AnnotationBadge`, `LanguageSwitcher`, `Chip` with `onClick`); eslint or the prop types require it
there too.

## Naming

- kebab-case, `<area>-<element>`: `filter-toggle`, `user-menu-logout`, `media-new-folder`
- elements repeated per entity end with the entity's API ID, so tests can build the ID from an API
  response: `cell-${columnId}-${rowId}`, `column-head-${columnId}`, `table-switcher-table-${tableId}`,
  `media-folder-${folderId}`, `language-switcher-option-${langtag}`
- repeated elements without own ID get one name and are scoped by their container in the test:
  `getByTestId("media-folder-3").getByTestId("media-dirent-remove")`
- menus of `ButtonAction` (`options`) render into a portal outside their container, so their entries
  can't be scoped; only one menu is open at a time, open it via the scoped trigger and address the
  entry unscoped: `media-dirent-menu` → `media-dirent-remove`
- components rendered more than once on a page take the ID (or a prefix) from the caller:
  `LanguageSwitcher` uses `testId`, `${testId}-value` and `${testId}-option-${langtag}`
- never array indices: they change with sorting and filtering. Exception: rows the user adds
  without an ID of their own (filter rows, column attributes) keep their order and are named by
  position: `filter-row-${index}`, `column-editor-attribute-${index}`

## Table view

| Test ID                                         | Element                                                         |
| ----------------------------------------------- | --------------------------------------------------------------- |
| `cell-${columnId}-${rowId}`                     | cell; further languages of an expanded row append `-${langtag}` |
| `cell-editor`                                   | input of the cell being edited (shorttext, numeric)             |
| `text-editor`                                   | textarea of the text overlay                                    |
| `column-head-${columnId}`, `column-head-row-id` | column header, row id column                                    |
| `column-menu-${columnId}`                       | column header menu button; items `column-menu-sort-asc` etc.    |
| `row-meta-${rowId}`                             | row id cell; `row-expand` (visible on hover), `row-delete`      |
| `context-menu-<action>`                         | cell context menu items, e.g. `context-menu-delete-row`         |
| `header-new-row-button`, `table-new-row-button` | "add row" in the header and below the last row                  |
| `row-count`                                     | "x of y rows"                                                   |

## Overlays

`overlay` (each open overlay), `overlay-close`, `overlay-button-positive|negative|neutral`, `toast`.
