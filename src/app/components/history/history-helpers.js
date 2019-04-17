import f from "lodash/fp";
import moment from "moment";

import { maybe, merge, when } from "../../helpers/functools";

// Recursive reduction might cause stack overflow after a couple of
// tens of thousands of cell revisions
// This will track the current content status for all revisions, so we are able
// to calculate correct diffs for each single revision even when interjacent
// states are filtered out, or leave content unchanged
export const reduceRevisionHistory = column => revisions => {
  const n = (revisions || []).length;
  const reducedRevisions = new Array(n);
  const doReduce = (idx = 0, previousRevision = {}) => {
    const rev = revisions[idx];
    const cellContentChanged = rev.event === "cell_changed";
    const isMultiLanguage =
      rev.languageType === "language" || rev.languageType === "country";

    const changedLangtags = cellContentChanged
      ? isMultiLanguage
        ? f.keys(rev.value)
        : undefined
      : undefined;
    reducedRevisions[idx] = {
      ...rev,
      langtags: changedLangtags,
      revertable:
        rev.historyType.startsWith("cell") &&
        (rev.valueType === column.kind || rev.event.startsWith("annotation")),
      prevContent: previousRevision.fullValue,
      fullValue: cellContentChanged
        ? isMultiLanguage
          ? merge(previousRevision.fullValue || {}, rev.value)
          : rev.value
        : previousRevision.fullValue,
      idx
    };
    if (idx < n - 1) {
      doReduce(idx + 1, reducedRevisions[idx]);
    }
  };
  n > 0 && doReduce(); // calling doReduce during loading will throw
  return reducedRevisions;
};

export const notEnoughEntries = revs => revs.length < 2;

export const getCreationDay = f.compose(
  f.invokeArgs("substring", [0, 10]),
  f.propOr("", "timestamp")
);

//------------------------------------------------------------------------------
// Revision filters. For easy combination, those are drop-filters.
// If any filter method is supplied, the respective filter is applied to the
// inputs; if config for any filter is omitted, it lets all values pass.
//------------------------------------------------------------------------------

export const matchesLangtag = langtag => rev =>
  rev.languageType === "language" ? f.has(langtag, rev.value) : true;

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
  rev.historyType === "cell_flag" ? !!(filter && filter.showAnnotations) : true;

export const filterComments = filter => rev =>
  rev.historyType === "cell_comment" ? !!(filter && filter.showComments) : true;

export const matchesUser = filter =>
  f.isEmpty(filter && filter.author)
    ? f.stubTrue
    : f.compose(
        f.contains(filter.author),
        f.prop("author")
      );

export const valueMatchesFilter = (filter, contentLangtag) =>
  f.isEmpty(filter && filter.value) || f.isEmpty(contentLangtag)
    ? f.stubTrue
    : (revision = {}) =>
        revision.event === "cell_changed"
          ? f.compose(
              f.any(f.contains(filter.value.toLowerCase())),
              f.map(f.toLower),
              f.map(when(f.isObject, f.prop(contentLangtag))),
              f.props([
                "displayValue",
                "prevDisplayValue",
                "value",
                "prevContent"
              ])
            )(revision)
          : revision.historyType === "cell_comment"
          ? f.contains(filter.value.toLowerCase(), revision.value.toLowerCase())
          : false;
