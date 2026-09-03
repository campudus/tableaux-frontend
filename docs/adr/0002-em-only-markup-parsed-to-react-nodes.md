# `<em>` is the only markup in a format pattern, and it is parsed into React nodes

A format pattern needs a way to set an attribute value apart from the identifier — e.g. a
percentage as a small badge instead of bare text — which means some markup in a string that
reaches the DOM. Two obvious routes: sanitise and hand to `dangerouslySetInnerHTML`, or accept a
small markup language (Markdown) and render with a library. **We chose neither: `<em>` is the
only tag with meaning, and the string is parsed into React elements ourselves.**

Parsing instead of sanitising makes the safety property structural, not diligent.
`parseFormattedLabel` recognises a bare opening/closing `em` and nothing else; any other tag, an
`em` with attributes, or a stray/mismatched end tag stays literal text, which React escapes on
render. No `dangerouslySetInnerHTML` anywhere in this path — a pattern cannot inject markup even
if someone tries, no allowlist or sanitiser version to maintain. A full markup language was
rejected for the same reason plus: patterns are short display templates authored by whoever
configures a column, and emphasis is the one thing they need.

Two consequences. An emphasised span renders as a filled badge, so an empty one would appear as
a stray coloured box — exactly what a pattern produces when its attribute has no value — so
empty emphasis is pruned during parsing (whitespace counts as empty). And the markup is only
meaningful on link chips, so it's stripped everywhere else: identifier cells, overlay titles,
`title` attributes, tooltips, preview components, and — easy to miss — filtering/sorting, which
would otherwise compare against text the user never sees. Stripping applies only to link,
concat and group columns; in plain text, a typed `<em>` is the user's own content, and removing
it would break search for it.
