import React from "react";
import i18n from "i18next";
import {getLanguageOrCountryIcon} from "../../helpers/multiLanguage";
import {
  findIndex,
  map,
  sortBy,
  reduce,
  entries,
  compose,
  first,
  keys,
  assoc,
  cond,
  eq,
  identity,
  always,
  stubTrue
} from "lodash/fp";
import {ColumnKinds, DateFormats, DateTimeFormats, Langtags} from "../../constants/TableauxConstants";
import Moment from "moment";
const EMPTY_STRING = "---";
const {date, datetime} = ColumnKinds;

class PasteMultilanguageCellInfo extends React.Component {
  static propTypes = {
    langtag: React.PropTypes.string.isRequired,
    oldVals: React.PropTypes.object.isRequired,
    newVals: React.PropTypes.object.isRequired,
    kind: React.PropTypes.string.isRequired
  };

  renderEntry = kind => ([key, value]) => {
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
      <div className="icon">
        {getLanguageOrCountryIcon(key)}
      </div>
      <div className="text">
        {(value) ? formatValue(value) : EMPTY_STRING}
      </div>
    </div>;
  };

  langtagComparator([langtag, value]) {
    return findIndex(eq(langtag));
  }

  render() {
    const {oldVals, newVals, kind} = this.props;
    const oldValsWithAllKeys = reduce(
      (result, key) => assoc(key, oldVals[key], result),
      {}, keys(newVals)
    );

    const getEntries = kind => compose(
      map(this.renderEntry(kind)),
      sortBy(this.langtagComparator),
      entries
    );

    return (
      <div id="confirm-copy-overlay-content" className="confirmation-overlay">
        <div className="info-text">{i18n.t("table:confirm_copy.info")}</div>
        <div className="details-container">
          <div className="details left">
            {getEntries(kind)(oldValsWithAllKeys)}
          </div>
          <div className="details right">
            {getEntries(kind)(newVals)}
          </div>
        </div>
      </div>
    );
  }
}

export default PasteMultilanguageCellInfo;
