import React, { useEffect, useState } from "react";
import f from "lodash/fp";
import moment from "moment";

import PropTypes from "prop-types";

import { cellSpec } from "../../specs/cell-spec";
import { doto, maybe, merge, when } from "../../helpers/functools";
import { makeRequest } from "../../helpers/apiHelper";
import { validateProp } from "../../specs/type";
import RevisionItemBlock from "./RevisionItemBlock";
import getDisplayValue from "../../helpers/getDisplayValue";
import route from "../../helpers/apiRoutes";

const HistoryBody = props => {
  const {
    sharedData,
    sharedData: { filter },
    updateSharedData,
    langtag,
    cell
  } = props;
  const { table, column, row } = cell;
  const [revisions, setRevisions] = useState([]);

  // Init shared data for header, filter and body
  useEffect(() => {
    updateSharedData(data => ({
      ...data,
      contentLangtag: langtag,
      filter: {}
    }));
    makeRequest({
      apiRoute: route.toCellHistory({
        tableId: table.id,
        rowId: row.id,
        columnId: column.id
      })
    })
      .then(f.prop("rows"))
      .then(setRevisions)
      .catch(console.error);
  }, []);

  const retrieveDisplayValue = rev =>
    f.pipe(
      f.assoc(
        "displayValue",
        f.propEq("valueType", column.kind)
          ? getDisplayValue(column, rev.fullValue || {})
          : {}
      ),
      f.assoc(
        "prevDisplayValue",
        f.propEq("valueType", column.kind)
          ? getDisplayValue(column, rev.prevContent || {})
          : {}
      )
    )(rev);

  const contentLangtag = sharedData.contentLangtag || langtag;

  const filterFunction = f.allPass([
    filterAnnotations(filter),
    matchesLangtag(contentLangtag),
    isCurrentEnough(filter),
    isOldEnough(filter),
    matchesUser(filter),
    valueMatchesFilter(filter, contentLangtag)
  ]);

  const getVisibleRevisions = f.pipe(
    when(
      // If no history exists yet, add current state
      notEnoughEntries,
      f.concat(f.__, {
        value: cell.value,
        columnType: cell.column.kind,
        column_id: column.id, // eslint-disable-line camelcase
        row_id: row.id, // eslint-disable-line camelcase
        event: "cell_changed"
      })
    ),
    f.map(retrieveDisplayValue),
    f.filter(filterFunction),
    f.compact
  );

  return (
    <div className="history-overlay__body">
      {doto(
        revisions,
        reduceRevisionHistory(column),
        getVisibleRevisions,
        f.groupBy(getCreationDay),
        obj =>
          f
            .keys(obj)
            .map(timestamp => (
              <RevisionItemBlock
                key={timestamp}
                cell={cell}
                date={timestamp}
                revisions={obj[timestamp]}
                langtag={contentLangtag}
              />
            ))
      )}
    </div>
  );
};

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
      revertable: rev.valueType === column.kind,
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
  f.propOr("", [0, "timestamp"])
);

export const matchesLangtag = langtag => rev =>
  rev.languageType === "language" ? f.has(langtag, rev.value) : true;

export const matchesUser = filter =>
  f.isEmpty(filter && filter.user) ? f.stubTrue : f.propEq("user", filter.user);

export const filterHasValidDateProp = (prop, filter) =>
  maybe(filter)
    .map(f.prop(prop))
    .method("isValid")
    .getOrElse(false);

export const isCurrentEnough = filter =>
  filterHasValidDateProp("fromDate", filter)
    ? revision => moment(revision.timestamp).isAfter(filter.fromDate)
    : f.stubTrue;

export const isOldEnough = filter =>
  filterHasValidDateProp("toDate", filter)
    ? revision => moment(revision.timestamp).isBefore(filter.toDate)
    : f.stubTrue;

export const filterAnnotations = filter => rev => {
  const isAnnotationChange =
    rev.event === "annotation_added" || rev.event === "annotation_removed";
  const hasDesiredValue = f.isBoolean(filter && filter.showAnnotations)
    ? isAnnotationChange === filter.showAnnotations
    : true;
  return hasDesiredValue;
};

export const valueMatchesFilter = (filter, contentLangtag) =>
  f.isEmpty(filter && filter.value)
    ? f.stubTrue
    : revision =>
        f.any(f.contains(filter.value), [
          revision.displayValue[contentLangtag],
          revision.prevDisplayValue[contentLangtag],
          f.prop(contentLangtag, revision.value) || revision.value
        ]);

export default HistoryBody;
HistoryBody.propTypes = {
  langtag: PropTypes.string.isRequired,
  cell: validateProp(cellSpec)
};
