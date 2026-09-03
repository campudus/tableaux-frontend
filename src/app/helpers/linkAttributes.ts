/* eslint-disable @typescript-eslint/no-explicit-any */
import f from "lodash/fp";
import Moment from "moment";
import {
  ColumnKinds,
  DateFormats,
  DateTimeFormats
} from "../constants/TableauxConstants";
import { retrieveTranslation } from "./multiLanguage";

// Date/datetime attributes are edited with react-datetime (see
// LinkAttributesPopover), so their "input value" is a Moment, not a string.
type MomentInstance = ReturnType<typeof Moment>;

// `attributes[i]` belongs to `linkAttributes[i]` -- never match by name, see
// docs/adr/0006-link-attribute-values-stay-positional-in-the-client.md.

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
  // Optional because formatLinkLabel's callers pass loosely-typed objects from
  // the preview components; only setLinkAttributes/readLinkAttributes read it.
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

export const usesLinkAttributeFormat = (column?: any): boolean =>
  hasLinkAttributes(column) && !f.isEmpty(getLinkFormatPattern(column));

// Not `retrieveTranslation`: its checkOrThrow rejects the bare scalars a
// non-multilanguage attribute stores.
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

// Never test attribute values with f.isEmpty(): it is `true` for 0 and false,
// which would silently blank out a stored `0`.
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

// A pattern names an attribute, its value is stored positionally, so the index
// has to travel with the definition.
const findDefinitionByName = (
  definitions: LinkAttributeDefinition[],
  name: string
): { definition: LinkAttributeDefinition; index: number } | null => {
  const index = f.findIndex(def => def.name === name, definitions);
  // noUncheckedIndexedAccess can't see that index !== -1 makes this defined.
  return index === -1 ? null : { definition: definitions[index]!, index };
};

// Composes one link's label. `displayValue` is the linked row's identifier,
// already resolved to `langtag`.
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
  // A taxonomy link's display value is an array of path labels -- composing a
  // path through a pattern is out of scope, hand it back untouched.
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
      // NumberInput expects "" rather than null for an empty value -- same
      // convention as NumericEditCell#getValue.
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
      // No .utc()/.local() needed: the moment carries the correct absolute
      // instant, and react-datetime displays it in the browser's time zone
      // regardless of the moment's own utc/local mode.
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
      // Only a Moment or a clear reaches here: the calendar has no free-text
      // entry (input={false}).
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

// The endpoint requires exactly one value per definition: pad with `null`,
// drop extras.
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
