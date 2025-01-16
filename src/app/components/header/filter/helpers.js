import { match, otherwise, when } from "match-iz";
import f from "lodash/fp";
import {
  AnnotationConfigs,
  AnnotationKind
} from "../../../constants/TableauxConstants";
import { t } from "i18next";
import { retrieveTranslation } from "../../../helpers/multiLanguage";

export const mkAnnotationFilterTemplates = langtag => ({
  needsMyTranslation: [
    "annotation",
    "flag-type",
    "needs_translation",
    "has-language",
    langtag
  ],
  ...Object.fromEntries(
    f.flow(
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

export const getAnnotationColor = kind => {
  const configs = f.indexBy("name", AnnotationConfigs);
  return f.cond([
    [
      key => /needs.*?translation/i.test(key),
      () => f.prop(["needs_translation", "bgColor"], configs)
    ],
    [
      key => f.prop([key, "bgColor"], configs),
      key => f.prop([key, "bgColor"], configs)
    ],
    [() => true, () => "#ddd"]
  ])(kind);
};

export const getAnnotationTitle = (kind, langtag) => {
  const configs = f.indexBy("name", AnnotationConfigs);

  const getDisplayName = kind => {
    const displayName = f.prop([kind, "displayName"], configs);

    return retrieveTranslation(langtag, displayName);
  };

  return match(kind)(
    when("info", t("filter:has-comments")),
    when("final", t("table:filter.is_final")),
    when("needsAnyTranslation", getDisplayName("needs_translation")),
    when(
      "needsMyTranslation",
      `${getDisplayName("needs_translation")}: ${langtag}`
    ),
    otherwise(getDisplayName(kind))
  );
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
