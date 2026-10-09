import f from "lodash/fp";
import {
  Attachment,
  Column,
  COLUMN_KIND,
  ConcatColumn,
  LinkColumn,
  StatusColumn
} from "./grud";
import { RowIdColumn } from "../constants/TableauxConstants";
import { UserSetting, UserSettingKind } from "./userSettings";

// grud-sdk ships no column predicates
export const isConcatColumn = (column: Column): column is ConcatColumn =>
  column.kind === COLUMN_KIND.concat;
export const isLinkColumn = (column: Column): column is LinkColumn =>
  column.kind === COLUMN_KIND.link;
export const isStatusColumn = (column: Column): column is StatusColumn =>
  column.kind === COLUMN_KIND.status;

export const isRowIdColumn = (column: Column): column is typeof RowIdColumn =>
  column.id === -1 && column.name === "rowId";

export const isAttachment = (value?: unknown): value is Attachment =>
  f.isPlainObject(value) && f.has("uuid", value) && f.has("mimeType", value);

export function isUserSettingOfKind<Kind extends UserSettingKind>(
  setting: UserSetting,
  kind: Kind
): setting is Extract<UserSetting, { kind: Kind }> {
  return setting.kind === kind;
}
