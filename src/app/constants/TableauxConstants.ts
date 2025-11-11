import { Column, ColumnID, MultilangValue } from "../types/grud";

type Config = {
  authClientId?: string;
  authRealm?: string;
  authServerUrl?: string;
  disableAuth?: boolean;
  enableHistory?: boolean;
  injectPermissions?: string;
  showTableDropdown?: boolean;
  webhookUrl: string;
};

export let config: Config;

export const initConfig = (cfg: Config) => {
  config = cfg;
};

export const Directions = {
  DOWN: "DOWN",
  RIGHT: "RIGHT",
  LEFT: "LEFT",
  UP: "UP"
} as const;

// Lowercase on purpose. Reflects exact API naming
export const ColumnKinds = {
  attachment: "attachment",
  boolean: "boolean",
  concat: "concat",
  currency: "currency",
  date: "date",
  datetime: "datetime",
  group: "group",
  integer: "integer",
  link: "link",
  numeric: "numeric",
  richtext: "richtext",
  shorttext: "shorttext",
  status: "status",
  text: "text",
  origintable: "origintable"
} as const;

export const TableType = {
  taxonomy: "taxonomy",
  settings: "settings",
  default: "default"
};

export const ImmutableColumnKinds = ["status", "concat"] as const;

export const LanguageType = {
  country: "country",
  language: "language"
} as const;

export const ViewNames = {
  TABLE_VIEW: "TABLE_VIEW",
  MEDIA_VIEW: "MEDIA_VIEW",
  DASHBOARD_VIEW: "DASHBOARD_VIEW",
  FRONTEND_SERVICE_VIEW: "FRONTEND_SERVICE_VIEW",
  TAXONOMY_DASHBOARD_VIEW: "TAXONOMY_DASHBOARD_VIEW",
  PROFILE_VIEW: "PROFILE_VIEW"
} as const;

export const Alignments = {
  UPPER_LEFT: "UPPER_LEFT",
  UPPER_RIGHT: "UPPER_RIGHT",
  LOWER_LEFT: "LOWER_LEFT",
  LOWER_RIGHT: "LOWER_RIGHT"
} as const;

export const DateTimeFormats = {
  formatForServer: "YYYY-MM-DDTHH:mm:ss.SSSZ",
  formatForUser: "DD.MM.YYYY - HH:mm"
} as const;

export const DateFormats = {
  formatForServer: "YYYY-MM-DD",
  formatForUser: "DD.MM.YYYY"
} as const;

export const RowHeight = 46; // Fixed pixel height of a single row including border

export const PageTitle = "GRUD";

// This is a meta column which doesn't exist in (or is not provided by) the backend
// but is needed for sorting in the frontend
export const RowIdColumn: Column = {
  id: ColumnID(-1),
  ordering: -1,
  displayName: { de: "ID" },
  identifier: false,
  kind: "numeric",
  multilanguage: false,
  name: "rowId",
  separator: false,
  attributes: {},
  description: {}
} as const;

export let Langtags = ["de-DE"];
export let DefaultLangtag = "de-DE";
export const FallbackLanguage = "en";

export const initLangtags = (langtags: string[]) => {
  Langtags = langtags || null;
  DefaultLangtag = langtags[0] || DefaultLangtag;
};

export const SortValue = {
  asc: "asc",
  desc: "desc"
} as const;

export const FilterModes = {
  ANY_UNTRANSLATED: "ANY_UNTRANSLATED",
  CHECK_ME: "CHECK_ME",
  CONTAINS: "CONTAINS",
  FINAL: "FINAL",
  ID_ONLY: "ID_ONLY",
  IS_EMPTY: "IS_EMPTY",
  IMPORTANT: "IMPORTANT",
  POSTPONE: "POSTPONE",
  ROW_CONTAINS: "ROW_CONTAINS",
  STARTS_WITH: "STARTS_WITH",
  STATUS: "STATUS",
  TRANSLATOR_FILTER: "TRANSLATOR_FILTER",
  UNTRANSLATED: "UNTRANSLATED",
  WITH_COMMENT: "WITH_COMMENT"
} as const;

type AnnotationKind = "flag" | "row-prop" | "data";

export const AnnotationKind = {
  flag: "flag",
  rowProp: "row-prop",
  data: "data"
} as const;

export const TableKind = {
  generic: "generic",
  taxonomy: "taxonomy",
  union: "union"
} as const;
export type TableKind = typeof TableKind[keyof typeof TableKind];

type AnnotationConfig = {
  name: string;
  kind: AnnotationKind;
  bgColor?: string;
  fgColor?: string;
  displayName?: MultilangValue<string>;
  isCustom?: boolean;
  isDashboard?: boolean;
  isMultilang?: boolean;
  priority?: number;
};

export let AnnotationConfigs: AnnotationConfig[] = [];

export const initAnnotationConfigs = (
  configs: Omit<AnnotationConfig, "kind">[]
) => {
  AnnotationConfigs = [
    { name: "info", kind: AnnotationKind.data },
    { name: "final", kind: AnnotationKind.rowProp },
    ...configs.map(annotationConfig => ({
      ...annotationConfig,
      kind: AnnotationKind.flag
    }))
  ];
};
