import keyMirror from "keymirror";

export let config;

export const initConfig = cfg => {
  config = cfg;
};

export const Directions = keyMirror({
  DOWN: null,
  RIGHT: null,
  LEFT: null,
  UP: null
});

// Lowercase on purpose. Reflects exact API naming
export const ColumnKinds = keyMirror({
  attachment: null,
  boolean: null,
  concat: null,
  currency: null,
  date: null,
  datetime: null,
  group: null,
  integer: null,
  link: null,
  numeric: null,
  richtext: null,
  shorttext: null,
  status: null,
  text: null
});

export const ImmutableColumnKinds = ["status", "concat"];

export const LanguageType = keyMirror({
  country: null,
  language: null
});

export const ViewNames = keyMirror({
  TABLE_VIEW: null,
  MEDIA_VIEW: null,
  DASHBOARD_VIEW: null,
  FRONTEND_SERVICE_VIEW: null,
  TAXONOMY_DASHBOARD_VIEW: null,
  PROFILE_VIEW: null
});

export const Alignments = keyMirror({
  UPPER_LEFT: null,
  UPPER_RIGHT: null,
  LOWER_LEFT: null,
  LOWER_RIGHT: null
});

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

export const SortValue = keyMirror({
  asc: null,
  desc: null
});

export const FilterModes = keyMirror({
  ANY_UNTRANSLATED: null,
  CHECK_ME: null,
  CONTAINS: null,
  FINAL: null,
  ID_ONLY: null,
  IS_EMPTY: null,
  IMPORTANT: null,
  POSTPONE: null,
  ROW_CONTAINS: null,
  STARTS_WITH: null,
  STATUS: null,
  TRANSLATOR_FILTER: null,
  UNTRANSLATED: null,
  WITH_COMMENT: null
});

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
    ...configs?.map(annotationConfig => ({
      ...annotationConfig,
      kind: AnnotationKind.flag
    }))
  ];
};
