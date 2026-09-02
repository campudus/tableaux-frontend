# `<em>` is the only markup in a format pattern, and it is parsed into React nodes

A format pattern is authored in the backend and needs a way to set an attribute value apart
from the identifier — a percentage rendered as a small badge rather than as bare text. That
requires some markup in a string that ultimately has to reach the DOM. The two obvious routes
were to sanitise the string and hand it to `dangerouslySetInnerHTML`, or to accept a small
markup language such as Markdown and render it with an existing library. **We chose neither:
`<em>` is the only tag with any meaning, and the string is parsed into React elements
ourselves.**

Parsing rather than sanitising is what makes the safety property structural instead of
diligent. `parseFormattedLabel` recognises a bare opening or closing `em` and nothing else;
any other tag, an `em` carrying attributes, and every stray or mismatched end tag stay literal
text, which React escapes on render. There is no `dangerouslySetInnerHTML` anywhere in this
path, so a pattern cannot inject markup even if someone writes one that tries — no allowlist to
keep current, no sanitiser version to track. A full markup language was rejected for the same
reason plus a second one: patterns are short display templates written by whoever configures a
column, and the one thing they need is emphasis.

Two consequences follow. Because an emphasised span renders as a filled badge, an empty one
would appear as a stray coloured box — which is exactly what a pattern produces when the
attribute it wraps has no value — so empty emphasis is pruned during parsing, whitespace
counting as empty. And because the markup is only meaningful on link chips, it has to be
removed everywhere else: identifier cells, overlay titles, `title` attributes, tooltips,
preview components, and — the easiest to overlook — filtering and sorting, which otherwise
compare against text the user never sees. That stripping is applied to link, concat and group
columns only. In a plain text column a typed `<em>` is the user's own content, and removing it
before comparing would make searching for it fail.
