import { Filter } from "./grud";

export type UserSettingKeyGlobal =
  | "filterReset"
  | "sortingReset"
  | "sortingDesc"
  | "columnsReset"
  | "annotationReset"
  | "markdownEditor";

export type UserSettingKeyTable =
  | "annotationHighlight"
  | "columnOrdering"
  | "columnWidths"
  | "visibleColumns"
  | "rowsFilter";

export type UserSettingKeyFilter = "presetFilter";

export type UserSettingKey =
  | UserSettingKeyGlobal
  | UserSettingKeyTable
  | UserSettingKeyFilter;

export type UserSettingValue<Key extends UserSettingKey> = Extract<
  UserSetting,
  { key: Key }
>["value"];

export type UserSettingKind = "global" | "table" | "filter";

export type UserSettingBase<
  Key extends string,
  Kind extends UserSettingKind,
  Value = unknown
> = {
  key: Key;
  kind: Kind;
  value: Value;
  createdAt: string; // ISO
  updatedAt?: string; // ISO
};

export type UserSettingGlobal<
  Key extends UserSettingKeyGlobal = UserSettingKeyGlobal,
  Value = unknown
> = UserSettingBase<Key, "global", Value>;

export type UserSettingTable<
  Key extends UserSettingKeyTable = UserSettingKeyTable,
  Value = unknown
> = UserSettingBase<Key, "table", Value> & {
  tableId: number;
};

export type UserSettingFilter<
  Key extends UserSettingKeyFilter = UserSettingKeyFilter,
  Value = unknown
> = UserSettingBase<Key, "filter", Value> & {
  id: number;
  name: string;
};

// user settings global
export type UserSettingFilterReset = UserSettingGlobal<"filterReset", boolean>;

export type UserSettingSortingReset = UserSettingGlobal<
  "sortingReset",
  boolean
>;

export type UserSettingSortingDesc = UserSettingGlobal<"sortingDesc", boolean>;

export type UserSettingColumnsReset = UserSettingGlobal<
  "columnsReset",
  boolean
>;

export type UserSettingAnnotationReset = UserSettingGlobal<
  "annotationReset",
  boolean
>;

export type UserSettingMarkdownEditor = UserSettingGlobal<
  "markdownEditor",
  "WYSIWYG" | "DIRECT"
>;

// user settings table
export type UserSettingAnnotationHighlight = UserSettingTable<
  "annotationHighlight",
  string
>;

export type UserSettingColumnOrdering = UserSettingTable<
  "columnOrdering",
  Array<{ id: number; idx: number }>
>;

export type UserSettingColumnWidths = UserSettingTable<
  "columnWidths",
  Record<number, number>
>;

export type UserSettingVisibleColumns = UserSettingTable<
  "visibleColumns",
  Array<number>
>;

export type UserSettingRowsFilter = UserSettingTable<
  "rowsFilter",
  {
    sortColumnName?: string;
    sortDirection?: "asc" | "desc";
    filters: Filter;
  }
>;

// user settings filter
export type UserSettingPresetFilter = UserSettingFilter<
  "presetFilter",
  {
    sortColumnName?: string;
    sortDirection?: "asc" | "desc";
    filters: Filter;
  }
>;

export type UserSetting =
  | UserSettingFilterReset
  | UserSettingSortingReset
  | UserSettingSortingDesc
  | UserSettingColumnsReset
  | UserSettingAnnotationReset
  | UserSettingMarkdownEditor
  | UserSettingAnnotationHighlight
  | UserSettingColumnOrdering
  | UserSettingColumnWidths
  | UserSettingVisibleColumns
  | UserSettingRowsFilter
  | UserSettingPresetFilter;

export type UserSettingParams<
  Kind extends UserSettingKind
> = Kind extends "global"
  ?
      | (Pick<UserSettingGlobal, "kind"> & { key?: never }) // GET
      | Pick<UserSettingGlobal, "kind" | "key"> // PUT
  : Kind extends "table"
  ?
      | (Pick<UserSettingTable, "kind"> & { tableId?: never; key?: never }) // GET
      | (Pick<UserSettingTable, "kind" | "tableId"> & { key?: never }) // GET or DELETE
      | Pick<UserSettingTable, "kind" | "tableId" | "key"> // PUT or DELETE
  : Kind extends "filter"
  ?
      | (Pick<UserSettingFilter, "kind"> & { key?: never; id?: never }) // GET
      | (Pick<UserSettingFilter, "kind" | "key"> & { id?: never }) // PUT
      | (Pick<UserSettingFilter, "kind" | "id"> & { key?: never }) // DELETE
  : never;

export type UserSettingBody<
  Kind extends UserSettingKind,
  Key extends UserSettingKey
> = Kind extends "filter"
  ? { value: UserSettingValue<Key>; name: string }
  : { value: UserSettingValue<Key>; name?: never };
