# The link display value cache holds identifiers, not link labels

Rendering a table's link cells needs the identifier of every row they point at, so
`buildLinkDisplayValueCache` collects those identifiers once, keyed by target table and target
row. With link attributes, each link now shows a _label_ rather than a bare identifier — the
identifier composed through the column's format pattern with that link's own attribute values.
The obvious move would have been to let the cache hold the finished label, so that every
consumer could read a ready-to-render string. **We deliberately did not: the cache stores the
target row's plain identifier, and the label is composed later, at each place where the
individual link is known.**

The reason is that one cache entry is shared. Three links pointing at the same supplier row
produce one entry, and their attribute values differ — a label baked in there would be one
link's label served to all of them. The entry is also published as index 0 of the target
table's own per-column display values, where it is merged index-wise, and that merge is only
correct while the entry equals the target's identifier; a formatted label would corrupt the
target table's identifier column. Composing per link is also cheap in the direction that
matters: the expensive part is resolving the identifier, which stays shared, while the pattern
substitution is a string replace over a handful of tokens.

The price is that every consumer has to remember to compose, and there are several — the
display value worker, the row filters, the link overlay cache, the entity view body and the
history diff all read the cache and all call `formatLinkLabel` themselves. Forgetting to do so
does not fail loudly; it silently shows the unformatted identifier, which looks like a
perfectly plausible label. That is the trade we accepted for not having a cache that is wrong
for every link but the first.
