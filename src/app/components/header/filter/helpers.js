import { match, otherwise, when } from "match-iz";
import f from "lodash/fp";

export const AnnotationFilter = {
  final: "final",
  important: "important",
  postpone: "postpone",
  doubleCheck: "doubleCheck",
  hasComments: "hasComments",
  needsAnyTranslation: "needsAnyTranslation",
  needsMyTranslation: "needsMyTranslation"
};

export const mkAnnotationFilterTemplates = langtag => ({
  final: ["row-prop", "final", "is-set"],
  important: ["annotation", "flag-type", "important", "is-set"],
  postpone: ["annotation", "flag-type", "postpone", "is-set"],
  doubleCheck: ["annotation", "flag-type", "double-check", "is-set"],
  hasComments: ["annotation", "type", "info", "is-set"],
  needsAnyTranslation: [
    "annotation",
    "flag-type",
    "needs_translation",
    "is-set"
  ],
  needsMyTranslation: [
    "annotation",
    "flag-type",
    "needs_translation",
    "has-language",
    langtag
  ]
});

export const toCombinedFilter = settings => {
  const validSettings = settings;

  const combined = match(validSettings.length)(
    when(0, []),
    when(1, f.first(validSettings)),
    otherwise(["and", ...validSettings])
  );
  return combined;
};

export const fromCombinedFilter = (columns, langtag) => {
  const templates = mkAnnotationFilterTemplates(langtag);
  const columnLookup = f.indexBy("name", columns);

  const filterToSettingM = (
    filter = [],
    rowFilters = [],
    annotationFilters = {}
  ) => {
    const [kind, ...rest] = filter;

    if (kind === "value") {
      const [colName, mode, value] = rest;
      const column = columnLookup[colName];
      rowFilters.push({ column, mode, value });
      console.log("adding value filter", colName, mode, value, rowFilters);
    } else if (kind === "and") {
      rest.forEach(next =>
        filterToSettingM(next, rowFilters, annotationFilters)
      );
    } else {
      const [templateName] =
        Object.entries(templates).find(([_, setting]) =>
          f.equals(setting, filter)
        ) || [];
      if (templateName) annotationFilters[templateName] = true;
    }
    return { rowFilters, annotationFilters };
  };
  return filter => filterToSettingM(filter, [], {});
};
