import { match, otherwise, when } from "match-iz";
import f from "lodash/fp";
import {
  AnnotationConfigs,
  AnnotationKind
} from "../../../constants/TableauxConstants";

export const mkAnnotationFilterTemplates = langtag => ({
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
  ],
  ...Object.fromEntries(
    f.flow(
      f.reject(config => config.name === "needs_translation"), // already set via "needsAnyTranslation" and "needsMyTranslation"
      f.sortBy("priority"),
      f.map(({ name, kind }) =>
        match(kind)(
          when(AnnotationKind.flag, [
            name,
            ["annotation", "flag-type", name, "is-set"]
          ]),
          when(AnnotationKind.data, [
            name,
            ["annotation", "type", name, "is-set"]
          ]),
          when(AnnotationKind.rowProp, [name, ["row-prop", name, "is-set"]])
        )
      )
    )(AnnotationConfigs)
  )
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
    } else if (kind === "any-value") {
      const [mode, value] = rest;
      const column = columnLookup["any-column"];
      rowFilters.push({ column, mode, value });
    } else if (kind === "row-prop" && rest[0] === "id") {
      rowFilters.push(["value", "rowId", ...rest.slice(1)]);
    } else if (kind === "and") {
      rest.forEach(next =>
        filterToSettingM(next, rowFilters, annotationFilters)
      );
    } else if (kind === "or") {
      const values = rest.flatMap(args => args.slice(-1));
      const setting = rest[0].slice(0, -1);
      const multiFilter = [...setting, values.join("|")];
      filterToSettingM(multiFilter, rowFilters, annotationFilters);
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
