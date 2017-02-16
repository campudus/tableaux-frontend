import React from "react";
import i18n from "i18next";
import {getLanguageOrCountryIcon} from "../../helpers/multiLanguage";
import {map, sortBy, reduce, entries, compose, first, keys, assoc} from "lodash/fp";

const EMPTY_STRING = "---";

class PasteMultilanguageCellInfo extends React.Component{
  static propTypes = {
    langtag: React.PropTypes.string.isRequired,
    oldVals: React.PropTypes.object.isRequired,
    newVals: React.PropTypes.object.isRequired
  };

  renderEntry = ([key, value]) => {
    return <div key={key} className="entry">
      <div className="icon">
        {getLanguageOrCountryIcon(key)}
      </div>
      <div className="text">
        {value || EMPTY_STRING}
      </div>
    </div>
  };

  render() {
    const {oldVals,newVals} = this.props;
    const oldValsWithAllKeys = reduce(
      (result, key) => assoc(key, oldVals[key], result),
      {}, keys(newVals)
    );

    const getEntries = compose(
      map(this.renderEntry),
      sortBy(first),
      entries
    );
    return (
      <div id="confirm-copy-overlay-content" className="confirmation-overlay">
        <div className="info-text">{i18n.t("table:confirm_copy.info")}</div>
        <div className="details-container">
          <div className="details left">
            {getEntries(oldValsWithAllKeys)}
          </div>
          <div className="details right">
            {getEntries(newVals)}
          </div>
        </div>
      </div>
    )
  }
}

export default PasteMultilanguageCellInfo;