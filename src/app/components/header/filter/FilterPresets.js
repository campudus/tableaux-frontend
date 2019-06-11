import f from "lodash/fp";
import i18n from "i18next";

import { FilterModes, Langtags } from "../../../constants/TableauxConstants";

export const FILTER_TEMPLATES_KEY = "savedFilters";

export const getFilterTemplates = f.memoize(langtag => {
  const filters = [
    langtag === f.first(Langtags)
      ? {
          mode: FilterModes.ANY_UNTRANSLATED,
          title: "table:filter.needs_translation"
        }
      : {
          mode: FilterModes.UNTRANSLATED,
          title: "table:translations.this_translation_needed"
        },
    { mode: FilterModes.FINAL, title: "table:filter.is_final" },
    { mode: FilterModes.IMPORTANT, title: "table:important" },
    { mode: FilterModes.CHECK_ME, title: "table:check-me" },
    { mode: FilterModes.LATER, table: "table:postpone" },
    { mode: FilterModes.WITH_COMMENTS, title: "filter:has-comments" }
  ];

  return filters.map(({ title, mode }) => ({
    isSystemTemplate: true,
    title: i18n.t(title, { langtag }),
    filters: [
      {
        mode,
        value: true,
        columnKind: "boolean"
      }
    ]
  }));
});
