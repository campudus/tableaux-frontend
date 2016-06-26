import React from 'react';
import _ from 'lodash';
import Dispatcher from '../../../dispatcher/Dispatcher';
import {getCountryOfLangtag, getCurrencyCode} from '../../../helpers/multiLanguage';
import CurrencyEditCell from './CurrencyEditCell';
import {getCurrencyWithCountry, splitPriceDecimals} from './currencyHelper';


export default class CurrencyCell extends React.Component {

  static propTypes = {
    cell : React.PropTypes.object.isRequired,
    langtag : React.PropTypes.string.isRequired,
    selected : React.PropTypes.bool.isRequired,
    editing : React.PropTypes.bool.isRequired,
    setCellKeyboardShortcuts : React.PropTypes.func
  };

  constructor(props) {
    super(props);
  }

  scrollHandler(event) {
    //prevents the table scroll event
    event.stopPropagation();
  }

  renderPrice(currencyObj, country) {
    const currencyValue = getCurrencyWithCountry(currencyObj, country);
    const splittedValueAsString = splitPriceDecimals(currencyValue);
    const currencyCode = getCurrencyCode(country);

    if (!currencyCode) {
      console.log("currencyCode is not country:", currencyCode);
      return (
        <div className="currency-wrapper">
          <span className="currency-no-country">unknown</span>
        </div>
      );
    }

    return (
      <div className="currency-wrapper">
        <span className="currency-value">
          {splittedValueAsString[0]}
        </span>
        <span className="currency-value-decimals">
          ,{splittedValueAsString[1]}
        </span>
      <span
        className="currency-code">{currencyCode}</span>
      </div>
    );

  }

  render() {
    const {selected, langtag, editing, cell, setCellKeyboardShortcuts} = this.props;
    const currencyObj = cell.value;
    const country = getCountryOfLangtag(langtag);
    let currencyCellMarkup;

    if (editing) {
      currencyCellMarkup = <CurrencyEditCell currencies={currencyObj} cell={cell} langtag={langtag}
                                             setCellKeyboardShortcuts={setCellKeyboardShortcuts}/>;
    } else {
      currencyCellMarkup = this.renderPrice(currencyObj, country);
    }

    return (
      <div className="cell-content" onScroll={this.scrollHandler}>
        {currencyCellMarkup}
      </div>
    );

  }

}
