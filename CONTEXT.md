# Tableaux Frontend

The React client for Tableaux. This glossary covers the terms the _frontend_ adds on top of
the domain — the ones about turning stored values into something a user reads.

The shared vocabulary for tables, rows, columns, links and attributes is defined once, in the
backend repository's own `CONTEXT.md`. It fixes **Link**, **Link relation**, **Link column**,
**Backlink column**, **Link
attribute** (with its _definition_ and its _value_), **Column attributes**, **Identifier
column**, **Concat column**, **Group column**, **Format pattern** and **Langtag**. Use those
terms here too; this file does not repeat them.

One rule from there is worth restating because it bites in this repo as well: **never write
_attribute_ unqualified.** Three unrelated things carry that name — a column's free-form
`attributes` object, a link column's `linkAttributes` definitions, and the `attributes` array
of values on an individual link. Always say which.

## Language

**Display value**:
The text a cell shows for one langtag. Every column kind has one, and it is what filtering,
sorting and search compare against.
_Avoid_: rendered value, cell text

**Identifier**:
The display value of a row's identifier columns. It stands in for that row wherever the row
appears inside another cell, so a link cell holds a copy of it for each row it links to.
_Avoid_: title, name, caption

**Link label**:
What one link shows: the linked row's identifier composed through the format pattern together
with that link's own attribute values. Two links to the same row can have different labels.
_Avoid_: label (unqualified) — it hides whether the attributes are involved

**Link display value cache**:
The identifiers collected per linked row and shared by every link pointing at that row.
Deliberately holds identifiers and never link labels, because one entry serves links whose
attribute values differ.
_Avoid_: link label cache

**Foreign display value**:
A display value that belongs to a row in another table than the one being rendered.
_Avoid_: remote value, external value

**Emphasis markup**:
The `<em>` element, the only markup a format pattern may contain. It survives into the link
chips and is reduced to plain text everywhere else.
_Avoid_: HTML, rich text — both suggest more is allowed than is
