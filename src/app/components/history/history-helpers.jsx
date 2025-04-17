import React from "react";
import f from "lodash/fp";
import moment from "moment";

import { ColumnKinds } from "../../constants/TableauxConstants";
import {
  composeP,
  mapP,
  maybe,
  merge,
  scan,
  when
} from "../../helpers/functools";
import { makeRequest } from "../../helpers/apiHelper";
import { retrieveTranslation } from "../../helpers/multiLanguage";
import Empty from "../helperComponents/emptyEntry";
import getDisplayValue from "../../helpers/getDisplayValue";
import route from "../../helpers/apiRoutes";

const NON_REVERTABLE_COLUMNS = [
  ColumnKinds.attachment,
  ColumnKinds.link,
  ColumnKinds.currency
];

export const reduceRevisionHistory = column => revisions => {
  const getRelativeRevision = (previousRevision, rev, idx) => {
    const cellContentChanged = rev.event === "cell_changed";
    const isLinked = [ColumnKinds.link, ColumnKinds.attachment].includes(
      column.kind
    );
    const isMultiLanguage =
      (rev.languageType === "language" || rev.languageType === "country") &&
      !isLinked;
    const emptyValue = isLinked ? [] : {};

    const changedLangtags =
      cellContentChanged && isMultiLanguage ? f.keys(rev.value) : undefined;

    const fullValue = cellContentChanged
      ? isMultiLanguage
        ? merge(previousRevision.fullValue || emptyValue, rev.value)
        : rev.value
      : previousRevision.fullValue;

    return {
      ...rev,
      langtags: changedLangtags,
      revertable:
        rev.event === "cell_changed" && // only cell changes may be reverted
        rev.valueType === column.kind && // when the column changed, the value is meaningless
        !f.contains(column.kind, NON_REVERTABLE_COLUMNS), // links or files may no longer exist
      prevContent: previousRevision.fullValue,
      fullValue,
      idx
    };
  };
  return scan(getRelativeRevision, {}, revisions);
};

export const getCreationDay = f.compose(
  f.invokeArgs("substring", [0, 10]),
  f.propOr("", "timestamp")
);

// Add current display values to link items
export const maybeAddLabels = (column, langtag) =>
  column.kind === ColumnKinds.link
    ? addLinkLabels(column, langtag)
    : column.kind === ColumnKinds.attachment
    ? addAttachmentLabels(column, langtag)
    : f.identity;

const addLinkLabels = (column, langtag) => async revisions => {
  const linkIdColumn = await composeP(
    f.first,
    f.prop("columns"),
    makeRequest
  )({
    apiRoute: route.toAllColumns(column.toTable)
  });

  const relevantIds = f.compose(
    f.uniq,
    f.flatMap(getIdsFromRevision)
  )(revisions);

  const currentDisplayValues = await composeP(
    f.reduce(merge, {}),
    mapP(
      getCurrentLinkDisplayValue({
        tableId: column.toTable,
        column: linkIdColumn,
        langtag
      })
    )
  )(relevantIds);

  return revisions.map(f.assoc("currentDisplayValues", currentDisplayValues));
};

const addAttachmentLabels = (column, langtag) => async revisions => {
  const currentDisplayValues = f.compose(
    f.reduce(merge, {}),
    f.flatMap(getCurrentAttachmentDisplayValue(langtag)),
    f.compact,
    f.map("value")
  )(revisions);

  return revisions.map(f.assoc("currentDisplayValues", currentDisplayValues));
};

const getCurrentAttachmentDisplayValue = langtag =>
  f.map(({ uuid, title }) => ({
    [uuid]: retrieveTranslation(langtag, title)
  }));

const getIdsFromRevision = f.compose(f.map("id"), f.prop("value"));

const getCurrentLinkDisplayValue = ({ tableId, column, langtag }) => rowId => {
  const apiRoute = route.toCell({ tableId, columnId: column.id, rowId });
  return composeP(
    displayValue => ({ [rowId]: displayValue }),
    when(f.isEmpty, () => <Empty langtag={langtag} />),
    f.prop(langtag),
    getDisplayValue(column),
    f.prop("value"),
    makeRequest
  )({ apiRoute }).catch(() => {}); // fulfill request promises to deleted rows
};

//------------------------------------------------------------------------------
// Revision filters. For easy combination, those are drop-filters.
// If any filter method is supplied, the respective filter is applied to the
// inputs; if config for any filter is omitted, it lets all values pass.
//------------------------------------------------------------------------------

export const matchesLangtag = langtag => rev =>
  !Array.isArray(rev.value) && rev.languageType === "language"
    ? f.has(langtag, rev.value)
    : true;

export const filterHasValidDateProp = (prop, filter) =>
  maybe(filter)
    .map(f.prop(prop))
    .exec("isValid")
    .getOrElse(false);

export const isCurrentEnough = filter =>
  filterHasValidDateProp("fromDate", filter)
    ? revision =>
        moment(revision.timestamp).isAfter(filter.fromDate.startOf("day"))
    : f.stubTrue;

export const isOldEnough = filter =>
  filterHasValidDateProp("toDate", filter)
    ? revision =>
        moment(revision.timestamp).isBefore(filter.toDate.endOf("day"))
    : f.stubTrue;

export const filterAnnotations = filter => rev =>
  f.contains(rev.historyType, ["cell_flag", "row_flag"])
    ? !!(filter && filter.showAnnotations)
    : true;

export const filterComments = filter => rev =>
  rev.historyType === "cell_comment" ? !!(filter && filter.showComments) : true;

export const matchesUser = filter =>
  f.isEmpty(filter && filter.author)
    ? f.stubTrue
    : f.compose(f.contains(filter.author), f.prop("author"));

export const getSearchableValues = langtag => revision => {
  const candidates = [
    revision.displayValue,
    revision.prevDisplayValue,
    revision.value,
    revision.prevContent
  ];
  const getValueForLangtag = when(f.isObject, f.prop(langtag));
  const getLinkValues = f.map(f.compose(getValueForLangtag, f.prop("value")));

  const isAttachment = c =>
    f.any(f.isArray, c) && f.any(f.has("uuid"), f.flatten(c));
  const getAttachmentValues = f.map(f.prop(["externalName", langtag]));

  return f.cond([
    [isAttachment, f.flatMap(getAttachmentValues)],
    [f.any(f.isArray), f.flatMap(getLinkValues)],
    [f.stubTrue, f.map(getValueForLangtag)]
  ])(candidates);
};

export const valueMatchesFilter = (filter, contentLangtag) =>
  f.isEmpty(filter && filter.value) || f.isEmpty(contentLangtag)
    ? f.stubTrue
    : (revision = {}) =>
        revision.event === "cell_changed"
          ? f.compose(
              f.any(f.contains(filter.value.toLowerCase())),
              f.map(f.toLower),
              getSearchableValues(contentLangtag)
            )(revision)
          : revision.historyType === "cell_comment"
          ? f.contains(filter.value.toLowerCase(), revision.value.toLowerCase())
          : true;
