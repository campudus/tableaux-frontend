import React from "react";
import PropTypes from "prop-types";
import i18n from "i18next";
import {getLanguageOrCountryIcon} from "../../helpers/multiLanguage";
import {
  findIndex,
  map,
  sortBy,
  reduce,
  entries,
  compose,
  keys,
  assoc,
  cond,
  eq,
  identity,
  always,
  stubTrue,
  zip
} from "lodash/fp";
import {ColumnKinds, DateFormats, DateTimeFormats} from "../../constants/TableauxConstants";
import Moment from "moment";

const EMPTY_STRING = "---";
const {date, datetime} = ColumnKinds;
import InfoBox from "./InfoBox";

const PasteMultilanguageCellInfo = (props) => {
  const {oldVals, newVals, kind} = props;

  const renderEntry = (kind) => ([key, value]) => {
    if (kind === "flag") {
      return <div key={key} className="country-icon">{getLanguageOrCountryIcon(key)}</div>;
    }

    const MAX_LENGTH = 30;
    const formatValue = compose(
      text => (text.length > MAX_LENGTH) ? text.substring(0, MAX_LENGTH) + "..." : text,
      cond([
        [eq(date), always(str => Moment(str).format(DateFormats.formatForUser))],
        [eq(datetime), always(str => Moment(str).format(DateTimeFormats.formatForUser))],
        [stubTrue, always(identity)]
      ])(kind)
    );
    return <div key={key} className="entry">
      <div className="text">
        {(value) ? formatValue(value) : EMPTY_STRING}
      </div>
    </div>;
  };

  const langtagComparator = ([langtag, value]) => {
    return findIndex(eq(langtag));
  };

  const oldValsWithAllKeys = reduce(
    (result, key) => assoc(key, oldVals[key], result),
    {}, keys(newVals)
  );

  const getEntries = kind => compose(
    map(renderEntry(kind)),
    sortBy(langtagComparator),
    entries
  );

  const entrylist = zip(getEntries("flag")(oldValsWithAllKeys),
    zip(getEntries(kind)(oldValsWithAllKeys), getEntries(kind)(newVals)))
    .map(
      ([flag, [oldValue, newValue]], idx) => (
        <div key={idx} className="item">
          {flag}
          <div className="old">{oldValue}</div>
          <i className="fa fa-long-arrow-right" />
          <div className="new">{newValue}</div>
        </div>
      )
    );

  return (
    <div id="confirm-copy-overlay-content" className="confirmation-overlay">
      <InfoBox heading={i18n.t("table:confirm_copy.header")}
        message={i18n.t("table:confirm_copy.info")}
        type="question"
      />
      <div className="content-items">
        {entrylist}
      </div>
    </div>
  );
};

PasteMultilanguageCellInfo.propTypes = {
  langtag: PropTypes.string.isRequired,
  oldVals: PropTypes.object.isRequired,
  newVals: PropTypes.object.isRequired,
  kind: PropTypes.string.isRequired
};

export default PasteMultilanguageCellInfo;
