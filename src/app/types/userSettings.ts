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

export type UserSettingKind = "global" | "table" | "filter";

export type UserSetting<
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

type UserSettingGlobal<
  Key extends UserSettingKeyGlobal,
  Value = unknown
> = UserSetting<Key, "global", Value>;

type UserSettingTable<
  Key extends UserSettingKeyTable,
  Value = unknown
> = UserSetting<Key, "table", Value> & {
  tableId: number;
};

type UserSettingFilter<
  Key extends UserSettingKeyFilter,
  Value = unknown
> = UserSetting<Key, "filter", Value> & {
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

export type UserSettings = Array<
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
  | UserSettingPresetFilter
>;
