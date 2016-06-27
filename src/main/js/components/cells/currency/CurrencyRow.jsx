import React from 'react';
import {getCountryOfLangtag, getCurrencyCode, getLanguageOrCountryIcon} from '../../../helpers/multiLanguage';
import {splitPriceDecimals} from './currencyHelper';
import {isAllowedForNumberInput} from '../../../helpers/KeyboardShortcutsHelper';

export default class CurrencyRow extends React.Component {

  currencyInputTouched = false;

  static propTypes = {
    country : React.PropTypes.string.isRequired,
    countryCurrencyValue : React.PropTypes.number
  };

  constructor(props) {
    super(props);
  }

  //returns float 0 when nothing has ever been entered for this country
  mergeSplittedCurrencyValues() {
    const integerVal = String(this.refs.currencyInteger.value).trim();
    const decimalVal = String(this.refs.currencyDecimals.value).trim();
    const mergedVal = (integerVal === "" ? "0" : integerVal ) + "." + (decimalVal === "" ? "00" : decimalVal);
    return parseFloat(mergedVal);
  }

  //Gets called from parent component when unmounting to save the values
  saveThisCurrency = () => {
    const {country} = this.props;
    const newCurrencyFloatValue = this.mergeSplittedCurrencyValues();
    const oldCurrencyFloatValue = this.props.countryCurrencyValue;

    //User has changed nothing for this country and there's never been a value set
    if (oldCurrencyFloatValue === null && !this.currencyInputTouched) {
      return null;
    }
    //we just want to save this cell when value has changed
    if (newCurrencyFloatValue != oldCurrencyFloatValue) {
      return {[country] : newCurrencyFloatValue};
    }
    return null;
  }

  onKeyDownInput = (e) => {
    if (!isAllowedForNumberInput(e)) {
      e.preventDefault();
    }
  }

  currencyInputChanged = (e) => {
    this.currencyInputTouched = true;
  }

  renderCurrencyValue(value) {
    const splittedValue = splitPriceDecimals(value);

    return (
      <div>
        <input ref="currencyInteger" className="currency-input integer" type="text" defaultValue={splittedValue[0]}
               onKeyDown={this.onKeyDownInput} onChange={this.currencyInputChanged}/>
        <span className="delimiter">,</span>
        <input ref="currencyDecimals" onChange={this.currencyInputChanged} className="currency-input decimals"
               type="text" defaultValue={splittedValue[1]}
               onKeyDown={this.onKeyDownInput}/>
      </div>
    );
  }


  render() {
    const {country, countryCurrencyValue} = this.props;
    const currencyCode = getCurrencyCode(country);
    let currencyValue = this.renderCurrencyValue(countryCurrencyValue);

    return (
      <div className="currency-row">
        <div className="country-code">{getLanguageOrCountryIcon(country)}</div>
        <div className="currency-value">{currencyValue}</div>
        <div className="currency-code">{currencyCode}</div>
      </div>
    );
  }

}