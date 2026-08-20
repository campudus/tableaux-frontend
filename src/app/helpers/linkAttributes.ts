/* eslint-disable @typescript-eslint/no-explicit-any */
import f from "lodash/fp";
import Moment from "moment";
import {
  ColumnKinds,
  DateFormats,
  DateTimeFormats
} from "../constants/TableauxConstants";
import { retrieveTranslation } from "./multiLanguage";

// A moment instance, as returned by react-datetime's onChange -- date/
// datetime attribute inputs use react-datetime (see LinkAttributesPopover),
// so the "input value" representation for those two kinds is a Moment
// rather than a string.
type MomentInstance = ReturnType<typeof Moment>;

// Link attributes are values carried by a single link edge (a connection
// between two rows), as opposed to a "real" column. Their definition lives on
// the link column (`column.linkAttributes`) and is authored manually in the
// backend; the frontend only reads it. Values live positionally in the link
// entry's `attributes` array: `attributes[i]` belongs to `linkAttributes[i]`
// -- never match by name.

export type LinkAttributeKind =
  | "text"
  | "numeric"
  | "integer"
  | "boolean"
  | "date"
  | "datetime";

export type LangObject = Record<string, string | null | undefined>;

export type LinkAttributeDefinition = {
  name: string;
  kind: LinkAttributeKind;
  displayName?: LangObject;
  description?: LangObject;
  multilanguage?: boolean;
  decimalDigits?: number;
};

export type LinkAttributeValue = any;

export type LinkEntry = {
  // Optional because formatLinkLabel's callers often pass loosely-typed
  // objects (Record<string, any> from preview components); id is only
  // actually read by setLinkAttributes/readLinkAttributes.
  id?: number;
  value?: unknown;
  attributes?: LinkAttributeValue[];
  hiddenByRowPermissions?: boolean;
};

// A link column may be a union-table's origin column, in which case the
// linkAttributes/formatPattern live on `column.originColumn` (see
// getDisplayValue.js, which resolves the same way).
const resolveColumn = (column?: any) => column?.originColumn ?? column;

export const getLinkAttributeDefinitions = (
  column?: any
): LinkAttributeDefinition[] =>
  f.getOr([], "linkAttributes", resolveColumn(column));

export const hasLinkAttributes = (column?: any): boolean =>
  !f.isEmpty(getLinkAttributeDefinitions(column));

export const getLinkFormatPattern = (column?: any): string | undefined =>
  f.get("formatPattern", resolveColumn(column));

// The single gate deciding whether a link column's display value should be
// run through the formatPattern renderer at all. Both a definition AND a
// pattern are required -- a stray/legacy formatPattern must never blank out
// a label just because linkAttributes are absent (and vice versa).
export const usesLinkAttributeFormat = (column?: any): boolean =>
  hasLinkAttributes(column) && !f.isEmpty(getLinkFormatPattern(column));

// Resolve a raw stored attribute value (may be a multilanguage {langtag:
// value} object) down to a single scalar for the given langtag. This is
// intentionally NOT `retrieveTranslation`, which validates its input via
// checkOrThrow(getLangObjSpec()) and throws on values that aren't proper
// lang objects (e.g. plain numbers/booleans/strings for non-multilanguage
// attributes) -- attribute values are untyped from the backend's point of
// view, so we resolve leniently instead.
const resolveAttributeRawValue = (
  value: LinkAttributeValue,
  langtag: string
): LinkAttributeValue => {
  if (!f.isPlainObject(value)) {
    return value;
  }
  return f.has(langtag, value) ? value[langtag] : undefined;
};

const isEmptyAttributeValue = (raw: LinkAttributeValue): boolean =>
  f.isNil(raw) || (f.isNumber(raw) && f.isNaN(raw)) || raw === "";

// Format a single attribute's raw stored value to a display string.
// IMPORTANT: never use f.isEmpty() to test attribute values -- f.isEmpty(0)
// and f.isEmpty(false) are both `true` in lodash/fp, which would silently
// blank out a stored `0` or `false`.
export const formatAttributeValue = ({
  definition,
  value,
  langtag
}: {
  definition: LinkAttributeDefinition;
  value: LinkAttributeValue;
  langtag: string;
}): string => {
  const raw = resolveAttributeRawValue(value, langtag);

  if (definition.kind === ColumnKinds.boolean) {
    return raw === true
      ? retrieveTranslation(langtag)(definition.displayName || {}) ||
          definition.name
      : "";
  }

  if (isEmptyAttributeValue(raw)) {
    return "";
  }

  switch (definition.kind) {
    case ColumnKinds.date:
    case ColumnKinds.datetime: {
      const Formats =
        definition.kind === ColumnKinds.datetime
          ? DateTimeFormats
          : DateFormats;
      const moment = Moment(raw, Formats.formatForServer);
      return moment.isValid() ? moment.format(Formats.formatForUser) : "";
    }
    case ColumnKinds.numeric:
    case ColumnKinds.integer:
    case ColumnKinds.text:
    default:
      return String(raw);
  }
};

const MOUSTACHE_TOKEN = /\{\{\s*([^{}]*?)\s*\}\}/g;

// (column, link, langtag) -> definition index, keyed by name -- lazily built
// once per call since linkAttributes arrays are tiny (currently max 1).
const findDefinitionByName = (
  definitions: LinkAttributeDefinition[],
  name: string
): { definition: LinkAttributeDefinition; index: number } | null => {
  const index = f.findIndex(def => def.name === name, definitions);
  // index !== -1 guarantees definitions[index] exists; noUncheckedIndexedAccess
  // can't see that from a plain numeric index, hence the assertion.
  return index === -1 ? null : { definition: definitions[index]!, index };
};

// Render one link edge's display value through the column's formatPattern.
// `displayValue` is the already langtag-resolved value of the linked row
// (string), or an array of node labels for a taxonomy path link.
export const formatLinkLabel = ({
  column,
  link,
  displayValue,
  langtag
}: {
  column?: any;
  link?: LinkEntry;
  displayValue?: string | string[] | null;
  langtag: string;
}): string | string[] | null | undefined => {
  // Taxonomy links resolve to an array of path-node labels instead of a
  // single string; formatting them is out of scope, leave the array as-is
  // for callers (e.g. TaxonomyPath) to render unchanged.
  if (!usesLinkAttributeFormat(column) || f.isArray(displayValue)) {
    return displayValue;
  }

  if (link?.hiddenByRowPermissions) {
    return "";
  }

  const base = displayValue ?? "";
  const definitions = getLinkAttributeDefinitions(column);
  const formatPattern = getLinkFormatPattern(column) as string;

  let hasAnyRealValue = !f.isEmpty(base);

  const resolveToken = (token: string): string => {
    if (token === "value") {
      return base;
    }

    const match = /^attributes\.(.+)$/.exec(token);
    if (!match) {
      return "";
    }

    const found = findDefinitionByName(definitions, match[1] ?? "");
    if (!found) {
      return "";
    }

    const { definition, index } = found;
    const rawValue = f.get(["attributes", index], link);
    const rendered = formatAttributeValue({
      definition,
      value: rawValue,
      langtag
    });

    if (rendered) {
      hasAnyRealValue = true;
      return rendered;
    }
    // Boolean attributes render empty for false/null/missing -- never `_`.
    return definition.kind === ColumnKinds.boolean ? "" : "_";
  };

  const formatted = formatPattern.replace(MOUSTACHE_TOKEN, (_, token) =>
    resolveToken(token)
  );

  return hasAnyRealValue ? f.trim(formatted) : "";
};

// -- Input <-> stored value conversion, per attribute kind ------------------

export const toAttributeInputValue = ({
  definition,
  value,
  langtag
}: {
  definition: LinkAttributeDefinition;
  value: LinkAttributeValue;
  langtag: string;
}): string | number | boolean | MomentInstance | null => {
  const raw = resolveAttributeRawValue(value, langtag);

  switch (definition.kind) {
    case ColumnKinds.boolean:
      return raw === true;
    case ColumnKinds.numeric:
    case ColumnKinds.integer:
      // NumberInput (react-number-format under the hood) expects "" rather
      // than null/undefined for an empty value -- same convention as
      // NumericEditCell#getValue.
      return f.isNumber(raw) && !f.isNaN(raw) ? raw : "";
    case ColumnKinds.date: {
      if (!f.isString(raw)) {
        return null;
      }
      const moment = Moment(raw, DateFormats.formatForServer);
      return moment.isValid() ? moment : null;
    }
    case ColumnKinds.datetime: {
      if (!f.isString(raw)) {
        return null;
      }
      // No explicit .utc()/.local() conversion needed: the moment already
      // carries the correct absolute instant, and react-datetime displays
      // it in the browser's local time zone regardless of the moment's own
      // utc/local mode.
      const moment = Moment(raw, DateTimeFormats.formatForServer);
      return moment.isValid() ? moment : null;
    }
    case ColumnKinds.text:
    default:
      return f.isString(raw) ? raw : raw ?? "";
  }
};

export const parseAttributeInput = ({
  definition,
  input
}: {
  definition: LinkAttributeDefinition;
  input: any;
}): LinkAttributeValue => {
  switch (definition.kind) {
    case ColumnKinds.boolean:
      return Boolean(input);
    case ColumnKinds.numeric: {
      const num = f.isNumber(input) ? input : parseFloat(input);
      return f.isNaN(num) ? null : num;
    }
    case ColumnKinds.integer: {
      const num = f.isNumber(input) ? input : parseInt(input, 10);
      return f.isNaN(num) ? null : Math.round(num);
    }
    case ColumnKinds.date: {
      // input is a Moment (or null/undefined) from react-datetime's
      // onChange, since date attributes render with input={false} (no free
      // text entry -- see LinkAttributesPopover), so only valid moments or
      // an explicit clear ever reach here.
      const moment = f.isNil(input) ? null : Moment(input);
      return moment?.isValid()
        ? moment.format(DateFormats.formatForServer)
        : null;
    }
    case ColumnKinds.datetime: {
      const moment = f.isNil(input) ? null : Moment(input);
      return moment?.isValid()
        ? moment.format(DateTimeFormats.formatForServer)
        : null;
    }
    case ColumnKinds.text:
    default:
      return f.isEmpty(input) && input !== 0 ? null : String(input);
  }
};

// Build the exact-length attributes array the write endpoint requires:
// missing definitions are padded with `null`, extras are dropped.
export const buildAttributesPayload = (
  definitions: LinkAttributeDefinition[],
  draft: Record<number, LinkAttributeValue>
): LinkAttributeValue[] =>
  definitions.map((_, index) => (f.has(index, draft) ? draft[index] : null));

// -- Optimistic store patching / read-modify-write ---------------------------

export const setLinkAttributes = (
  linkId: number,
  attributes: LinkAttributeValue[],
  cellValue: LinkEntry[]
): LinkEntry[] =>
  f.map(
    link => (link.id === linkId ? { ...link, attributes } : link),
    cellValue || []
  );

export const readLinkAttributes = (
  linkId: number,
  cellValue: LinkEntry[]
): LinkAttributeValue[] | undefined =>
  f.get(
    "attributes",
    f.find(link => link.id === linkId, cellValue || [])
  );
