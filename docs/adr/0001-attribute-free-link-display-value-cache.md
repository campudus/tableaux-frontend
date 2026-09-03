# The link display value cache holds identifiers, not link labels

Rendering link cells needs the identifier of every row they point at, so
`buildLinkDisplayValueCache` collects those once, keyed by target table and row. With link
attributes, each link shows a _label_ — the identifier composed through the format pattern with
that link's own attribute values — rather than a bare identifier. The obvious move: let the
cache hold the finished label. **We didn't: the cache stores the plain identifier, and the
label is composed later, wherever the individual link is known.**

One cache entry is shared. Three links to the same supplier row produce one entry, and their
attribute values differ — a baked-in label would serve one link's label to all three. The entry
is also published as index 0 of the target table's own per-column display values, merged
index-wise; that merge is only correct while the entry equals the identifier, so a formatted
label would corrupt the identifier column. Composing per link is cheap in the direction that
matters too: resolving the identifier (shared, expensive) stays as-is, and pattern substitution
is a string replace over a handful of tokens.

The price: every consumer must remember to compose — the display value worker, row filters,
link overlay cache, entity view body, history diff all read the cache and call
`formatLinkLabel` themselves. Forgetting doesn't fail loudly; it silently shows the unformatted
identifier, which looks like a plausible label. That's the trade against a cache that's wrong
for every link but the first.
