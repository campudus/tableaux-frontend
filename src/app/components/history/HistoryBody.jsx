import React, { useEffect, useState } from "react";
import f from "lodash/fp";
import i18n from "i18next";

import PropTypes from "prop-types";

import { cellSpec } from "../../specs/cell-spec";
import {
  doto,
  forkJoin,
  ifElse,
  mapIndexed,
  merge,
  unless,
  when
} from "../../helpers/functools";
import {
  filterAnnotations,
  filterComments,
  getCreationDay,
  isCurrentEnough,
  isOldEnough,
  matchesLangtag,
  matchesUser,
  maybeAddLabels,
  reduceRevisionHistory,
  valueMatchesFilter
} from "./history-helpers";
import { makeRequest } from "../../helpers/apiHelper";
import { validateProp } from "../../specs/type";
import HistoryFilterArea from "./HistoryFilterArea";
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
  const contentLangtag = sharedData.contentLangtag || langtag;

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
      .then(maybeAddLabels(column, contentLangtag))
      .then(setRevisions)
      .catch(console.error);
  }, []);

  const retrieveDisplayValue = rev =>
    doto(
      rev,
      f.assoc(
        "displayValue",
        f.propEq("valueType", column.kind)
          ? getDisplayValue(column, when(f.isNil, () => {}, rev.fullValue))
          : {}
      ),
      f.assoc(
        "prevDisplayValue",
        f.propEq("valueType", column.kind)
          ? getDisplayValue(column, when(f.isNil, () => {}, rev.prevContent))
          : {}
      )
    );

  const filterFunction = f.allPass([
    filterAnnotations(filter),
    filterComments(filter),
    isCurrentEnough(filter),
    isOldEnough(filter),
    matchesUser(filter),
    valueMatchesFilter(filter, contentLangtag)
  ]);

  const getVisibleRevisions = f.pipe(
    f.map(retrieveDisplayValue),
    f.filter(matchesLangtag(contentLangtag)),
    mapIndexed((rev, idx) => ({ ...rev, idx })),
    f.filter(filterFunction),
    f.compact
  );

  return (
    <div className="history-overlay__body">
      <HistoryFilterArea {...props} />
      <div className="history-overlay__content">
        <div className="history-overlay__content-scroller">
          {doto(
            revisions,
            reduceRevisionHistory(column),
            unless(f.isEmpty, duplicateLastRevision),
            getVisibleRevisions,
            f.groupBy(ifElse(f.prop("isCurrent"), () => null, getCreationDay)),
            obj =>
              f
                .reverse(f.keys(obj))
                .map(timestamp => (
                  <RevisionItemBlock
                    key={timestamp}
                    cell={cell}
                    date={timestamp}
                    revisions={obj[timestamp]}
                    langtag={contentLangtag}
                  />
                )),
            f.concat(
              <div key="current-state" className="revision-block">
                <div className="revision__item">
                  <div className="revision-item__header">
                    <div className="revision-item-header__dot" />
                    <div className="revision-item-header__title">
                      {i18n.t("history:current-status")}
                    </div>
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

const duplicateLastRevision = forkJoin(
  f.concat,
  f.identity,
  f.compose(
    f.assoc("isCurrent", true),
    unless(rev => f.isEmpty(rev.fullValue), f.assoc("event", "cell_changed")),
    f.update("revision", f.add(1)),
    rev => merge(rev, { prevContent: rev.fullValue, value: rev.fullValue }),
    f.last
  )
);

export default HistoryBody;
HistoryBody.propTypes = {
  langtag: PropTypes.string.isRequired,
  cell: validateProp(cellSpec)
};
