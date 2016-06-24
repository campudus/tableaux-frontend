import React from 'react';
import _ from 'lodash';
import Dispatcher from '../../../dispatcher/Dispatcher';
import {getCountryOfLangtag, getCurrencyCode} from '../../../helpers/multiLanguage';
import CurrencyEditCell from './CurrencyCell';


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

  convertLangToCountry(langtag) {
    const country = getCountryOfLangtag(langtag);
    console.log("country is:", country, "langtag was:", langtag);
    return country;
  }

  getCurrencyWithCountry(currencyObj, country) {
    console.log("inside getCurrency:", currencyObj, country);
    return currencyObj[country] || null;
  }

  splitPriceDecimals(priceValue) {
    if (!_.isFinite(priceValue)) {
      return ["0", "00"];
    }
    let priceValueAsArray = String(priceValue).split(".");
    priceValueAsArray.length === 1 ? priceValueAsArray.push("00") : null;
    return priceValueAsArray;
  };

  renderPrice(currencyObj, country) {
    const currencyValue = this.getCurrencyWithCountry(currencyObj, country);
    const splittedValueAsString = this.splitPriceDecimals(currencyValue);
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
    const country = this.convertLangToCountry(langtag);
    let currencyCellMarkup;

    if (selected) {
      currencyCellMarkup =
        <CurrencyEditCell currencies={currencyObj} setCellKeyboardShortcuts={setCellKeyboardShortcuts}/>;


      /*return <LinkEditCell cell={self.props.cell} langtag={self.props.langtag}
       editing={self.props.editing}
       setCellKeyboardShortcuts={self.props.setCellKeyboardShortcuts}></LinkEditCell>*/

    } else {
      //Try to convert current language to country
      this.convertLangToCountry(langtag);
      currencyCellMarkup = this.renderPrice(currencyObj, country);
    }

    return (
      <div className={'cell-content'}>
        {currencyCellMarkup}
      </div>
    );

  }

}
