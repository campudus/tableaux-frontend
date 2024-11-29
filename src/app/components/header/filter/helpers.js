import { match, otherwise, when } from "match-iz";
import f from "lodash/fp";
import {
  Annotation,
  AnnotationKind
} from "../../../constants/TableauxConstants";
import { getCssVar } from "../../../helpers/getCssVar";

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
    Annotation.map(({ name, kind }) =>
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

export const getAnnotationColor = kind => {
  const annotationSettings = f.indexBy("name", Annotation);
  return f.cond([
    [
      key => /needs.*?translation/i.test(key),
      () => getCssVar("--color-needs-translation")
    ],
    [
      key => annotationSettings[key]?.color,
      key => annotationSettings[key].color
    ],
    [() => true, () => "#ddd"]
  ])(kind);
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
