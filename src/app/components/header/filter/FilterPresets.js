// @flow

import f from "lodash/fp";
import i18n from "i18next";

import { FilterModes, Langtags } from "../../../constants/TableauxConstants";
import { when, where } from "../../../helpers/functools";

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
    { mode: FilterModes.POSTPONE, title: "table:postpone" },
    { mode: FilterModes.WITH_COMMENT, title: "filter:has-comments" }
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

export const filterListToTemplate = (title, filters, columns) => {
  const filterColumnIds = filters |> f.map("columnId") |> f.map(f.parseInt(10));

  const columnInfo =
    columns
    |> f.filter(({ id }) => f.contains(id, filterColumnIds))
    |> f.map(f.pick(["name", "kind", "id"]));

  return {
    filters:
      filters
      |> f.reject(f.isEmpty)
      |> f.reject(
        filter =>
          (!f.isBoolean(filter.value) && f.isEmpty(filter.value)) ||
          f.isEmpty(filter.columnId)
      ),
    title,
    columnInfo
  };
};

export const canApplyTemplateToTable = f.curryN(2, (columns, template = {}) => {
  const { columnInfo } = template;

  const hasMatchingColumn = info => f.any(where(info), columns);
  return template.isSystemTemplate || f.every(hasMatchingColumn, columnInfo);
});

// convert a template's filter column ids by name and kind
export const adaptTemplateToTable = f.curryN(2, (columns, template) => {
  const isNumericColumnId = id =>
    id |> f.parseInt(10) |> isNaN |> f.negate(f.identity);

  const idMap =
    template.columnInfo.map(({ id, name, kind }) => ({
      id,
      name,
      kind,
      idHere: columns |> f.find(where({ kind, name })) |> f.prop("id")
    }))
    |> f.reduce((accum, next) => {
      accum[next.id] = next;
      return accum;
    }, {});

  const adaptColumnId = id => f.prop([id, "idHere"], idMap) |> f.parseInt(10);

  return f.update(
    "filters",
    f.map(filter => ({
      ...filter,
      columnId: when(isNumericColumnId, adaptColumnId, filter.columnId)
    })),
    template
  );
});

export type ColumnInfo = {
  name: string,
  type: string,
  id: number
};

export type Filter = {
  mode: string,
  value: string | boolean,
  columnKind: string
};

type FilterTemplate_ = {
  title: string,
  filters: [Filter]
};

export type SystemFilterTemplate = FilterTemplate_ & { isSystemTemplate: true };
export type UserFilterTemplate = FilterTemplate_ & {
  isSystemTemplate: ?boolean,
  columnInfo: ColumnInfo
};

export type FilterTemplate = SystemFilterTemplate | UserFilterTemplate;
