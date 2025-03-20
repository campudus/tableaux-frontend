export let config;

export const initConfig = cfg => {
  config = cfg;
};

export const Directions = {
  DOWN: "DOWN",
  RIGHT: "RIGHT",
  LEFT: "LEFT",
  UP: "UP"
};

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
  text: "text"
};

export const ImmutableColumnKinds = ["status", "concat"];

export const LanguageType = {
  country: "country",
  language: "language"
};

export const ViewNames = {
  TABLE_VIEW: "TABLE_VIEW",
  MEDIA_VIEW: "MEDIA_VIEW",
  DASHBOARD_VIEW: "DASHBOARD_VIEW",
  FRONTEND_SERVICE_VIEW: "FRONTEND_SERVICE_VIEW",
  TAXONOMY_DASHBOARD_VIEW: "TAXONOMY_DASHBOARD_VIEW",
  PROFILE_VIEW: "PROFILE_VIEW"
};

export const Alignments = {
  UPPER_LEFT: "UPPER_LEFT",
  UPPER_RIGHT: "UPPER_RIGHT",
  LOWER_LEFT: "LOWER_LEFT",
  LOWER_RIGHT: "LOWER_RIGHT"
};

export const DateTimeFormats = {
  formatForServer: "YYYY-MM-DDTHH:mm:ss.SSSZ",
  formatForUser: "DD.MM.YYYY - HH:mm"
};

export const DateFormats = {
  formatForServer: "YYYY-MM-DD",
  formatForUser: "DD.MM.YYYY"
};

export const RowHeight = 46; // Fixed pixel height of a single row including border

export const PageTitle = "GRUD";

// This is a meta column which doesn't exist in (or is not provided by) the backend
// but is needed for sorting in the frontend
export const RowIdColumn = {
  id: -1,
  ordering: -1,
  displayName: { de: "ID" },
  identifier: false,
  kind: "numeric",
  multilanguage: false,
  name: "rowId",
  separator: false
};

export let Langtags = ["de-DE"];
export let DefaultLangtag = "de-DE";
export const FallbackLanguage = "en";

export const initLangtags = langtags => {
  Langtags = langtags || null;
  DefaultLangtag = langtags[0] || null;
};

export const SortValue = {
  asc: "asc",
  desc: "desc"
};

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
};

export const AnnotationKind = {
  flag: "flag",
  rowProp: "row-prop",
  data: "data"
};

export let AnnotationConfigs = [];

export const initAnnotationConfigs = configs => {
  AnnotationConfigs = [
    { name: "info", kind: AnnotationKind.data },
    { name: "final", kind: AnnotationKind.rowProp },
    ...(configs?.map(annotationConfig => ({
      ...annotationConfig,
      kind: AnnotationKind.flag
    })) ?? [])
  ];
};
