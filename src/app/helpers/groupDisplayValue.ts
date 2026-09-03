import { stripFormattingTags } from "../components/helperComponents/FormattedLabel";
import { ColumnKinds } from "../constants/TableauxConstants";
import { ColumnKind, MultilangValue } from "../types/grud";
import getDisplayValue from "./getDisplayValue";
import { getColumnDisplayName, retrieveTranslation } from "./multiLanguage";

export type GroupMemberColumn = {
  id: number;
  kind: ColumnKind;
  name: string;
  displayName?: MultilangValue<string>;
  multilanguage?: boolean;
};

export type GroupDisplayColumn = {
  kind: ColumnKind;
  formatPattern?: string;
  groups?: GroupMemberColumn[];
  originColumn?: GroupDisplayColumn;
};

export type GroupBooleanPart = {
  label: string;
  value: boolean;
};

/**
 * The format pattern's literal text, interleaved with one part per boolean
 * member.
 */
export type GroupDisplayPart = string | GroupBooleanPart;

// A group column's display value is a single string, and a boolean member
// contributes its display name when true and nothing at all when false (see
// getBoolValue in getDisplayValue.js). Group cells show a boolean as an icon
// plus the member's name instead, so a boolean needs a part of its own.
//
// The format pattern is therefore taken apart here rather than filled in: it is
// split into its literal text and its "{{<column id>}}" tokens, and only the
// non-boolean tokens are turned into text. Order, separators, whitespace and
// the placeholder of an empty member stay as the plain display value has them.

// Splitting a pattern on this keeps the tokens in the result, in between the
// pattern's literal text: "{{1}} | {{2}}" becomes ["", "{{1}}", " | ", "{{2}}",
// ""]. The capturing group is what makes split() keep them.
const MEMBER_TOKEN_SPLIT = /(\{\{[^{}]*\}\})/;

// The column id a token names. A format pattern addresses its members by column
// id; where their values sit is a separate question (see renderToken).
const MEMBER_TOKEN_ID = /^\{\{\s*(\d+)\s*\}\}$/;

// What an empty member renders as, the way `format` in getDisplayValue.js does
// it. Boolean members are exempt: their icon shows either way.
const PLACEHOLDER = "_";

// Every piece of the split is either one of the pattern's tokens or a piece of
// its literal text, and only a token is wrapped in the braces.
function isGroupMemberToken(piece: string): boolean {
  return piece.startsWith("{{") && piece.endsWith("}}");
}

/**
 * A group column's value as the parts a cell renders. Pure -- the caller
 * decides how a boolean part looks.
 */
export function getGroupDisplayParts(
  column: GroupDisplayColumn,
  value: unknown,
  langtag: string
): GroupDisplayPart[] {
  const groupColumn = column.originColumn ?? column;
  const memberColumns = groupColumn.groups ?? [];
  const memberValues = Array.isArray(value) ? value : [];
  const groupPieces =
    groupColumn.formatPattern?.split(MEMBER_TOKEN_SPLIT).filter(Boolean) ?? [];

  if (groupPieces.length > 0) {
    return groupPieces.map(piece =>
      isGroupMemberToken(piece)
        ? renderToken(piece, memberColumns, memberValues, langtag)
        : stripFormattingTags(piece)
    );
  }

  return memberColumns.flatMap((memberCol, index) => {
    const isFirst = index === 0;
    const memberVal = memberValues[index];
    const part = renderGroupMember(memberCol, memberVal, langtag, PLACEHOLDER);

    return isFirst ? [part] : [" ", part];
  });
}

/**
 * Whether a group has nothing to show but placeholders, which is what greys a
 * group cell out. A boolean member always shows its icon, so a group holding
 * one is never placeholder-only.
 */
export function showsOnlyPlaceholders(
  column: GroupDisplayColumn,
  value: unknown,
  langtag: string
): boolean {
  const groupColumn = column.originColumn ?? column;
  const memberColumns = groupColumn.groups ?? [];
  const memberValues = Array.isArray(value) ? value : [];

  return !memberColumns.some((memberColumn, index) => {
    const memberValue = memberValues[index];

    return (
      memberColumn.kind === ColumnKinds.boolean ||
      renderGroupMemberText(memberColumn, memberValue, langtag) !== ""
    );
  });
}

// A "{{7}}" token stands for the member column with id 7. Which value belongs
// to it is a matter of that column's position: a group's value is an array
// positional to its member columns.
function renderToken(
  token: string,
  memberColumns: GroupMemberColumn[],
  memberValues: unknown[],
  langtag: string
): GroupDisplayPart {
  const match = MEMBER_TOKEN_ID.exec(token);

  if (!match) {
    // Not a column id, e.g. "{{name}}".
    return PLACEHOLDER;
  }

  const columnId = Number(match[1]);
  const memberColIndex = memberColumns.findIndex(({ id }) => id === columnId);
  const memberColumn = memberColumns[memberColIndex];
  const memberValue = memberValues[memberColIndex];

  if (!memberColumn) {
    // The pattern names a column that is not a member of this group.
    return PLACEHOLDER;
  }

  return renderGroupMember(memberColumn, memberValue, langtag, PLACEHOLDER);
}

// One member in the place the pattern gives it: a boolean becomes a part of its
// own -- the cell draws an icon for it -- everything else becomes text.
function renderGroupMember(
  column: GroupMemberColumn,
  value: unknown,
  langtag: string,
  placeholder: string
): GroupDisplayPart {
  if (column.kind === ColumnKinds.boolean) {
    return {
      value: Boolean(value),
      label: getColumnDisplayName(column, langtag) ?? column.name
    };
  }

  const text = renderGroupMemberText(column, value, langtag);

  return text || placeholder;
}

// A member's own display value as text. A link member delivers one entry per
// edge; the plain display value joins those with a space, so this does too.
function renderGroupMemberText(
  column: GroupMemberColumn,
  value: unknown,
  langtag: string
): string {
  const translate = retrieveTranslation(langtag);
  const displayValue = getDisplayValue(column)(value);
  const dvEntries = Array.isArray(displayValue) ? displayValue : [displayValue];

  return stripFormattingTags(
    dvEntries.map(dv => translate(dv)).join(" ")
  ).trim();
}
