import i18n from "i18next";
import {
  always,
  assoc,
  compose,
  entries,
  eq,
  filter,
  findIndex,
  identity,
  keys,
  map,
  reduce,
  sortBy,
  zip
} from "lodash/fp";
import { match, otherwise, when } from "match-iz";
import Moment from "moment";
import PropTypes from "prop-types";
import React from "react";
import {
  ColumnKinds,
  DateFormats,
  DateTimeFormats
} from "../../constants/TableauxConstants";
import { canUserChangeCell } from "../../helpers/accessManagementHelper";
import { getLanguageOrCountryIcon } from "../../helpers/multiLanguage";
import InfoBox from "./InfoBox";

const EMPTY_STRING = "---";
const { date, datetime } = ColumnKinds;

const truncateText = maxLength => text =>
  text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
const formatDate = pattern => str => Moment(str).format(pattern);

export const MultilangCellChangeInfo = ({
  cell,
  headingText,
  kind,
  messageText,
  newVals,
  oldVals,
  showOldValues: showNewValues
}) => {
  const renderEntry = kind => ([key, value]) => {
    if (kind === "flag") {
      return (
        <div key={key} className="country-icon">
          {getLanguageOrCountryIcon(key)}
        </div>
      );
    }

    const MAX_LENGTH = 30;
    const formatValue = compose(
      truncateText(MAX_LENGTH),
      match(kind)(
        when(date, always(formatDate(DateFormats.formatForUser))),
        when(datetime, always(formatDate(DateTimeFormats.formatForUser))),
        otherwise(always(identity))
      )
    );
    return (
      <div key={key} className="entry">
        <div className="text">{value ? formatValue(value) : EMPTY_STRING}</div>
      </div>
    );
  };

  const langtagComparator = ([langtag]) => {
    return findIndex(eq(langtag));
  };

  const oldValsWithAllKeys = reduce(
    (result, key) => assoc(key, oldVals[key], result),
    {},
    keys(newVals)
  );

  const getEntries = kind =>
    compose(
      map(renderEntry(kind)),
      sortBy(langtagComparator),
      filter(([langtag]) => canUserChangeCell(cell, langtag)),
      entries
    );

  const entrylist = zip(
    getEntries("flag")(oldValsWithAllKeys),
    zip(getEntries(kind)(oldValsWithAllKeys), getEntries(kind)(newVals))
  ).map(([flag, [oldValue, newValue]], idx) => (
    <div key={idx} className="item">
      {flag}
      <div className="old">{oldValue}</div>
      {showNewValues ? (
        <>
          <i className="fa fa-long-arrow-right" />
          <div className="new">{newValue}</div>
        </>
      ) : null}
    </div>
  ));

  return (
    <div id="confirm-copy-overlay-content" className="confirmation-overlay">
      <InfoBox heading={headingText} message={messageText} type="question" />
      <div className="content-items">{entrylist}</div>
    </div>
  );
};

MultilangCellChangeInfo.propTypes = {
  cell: PropTypes.object.isRequired,
  headingText: PropTypes.string,
  kind: PropTypes.string.isRequired,
  messageText: PropTypes.string,
  newVals: PropTypes.object.isRequired,
  oldVals: PropTypes.object.isRequired,
  showNewValues: PropTypes.bool
};

const PasteMultilanguageCellInfo = props => (
  <MultilangCellChangeInfo
    showNewValues
    headingText={i18n.t("table:confirm_copy.header")}
    messageText={i18n.t("table:confirm_copy.info")}
    {...props}
  />
);
export default PasteMultilanguageCellInfo;
