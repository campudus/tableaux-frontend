import React, {Component, PropTypes} from "react";
import {getCurrencyCode, getLanguageOrCountryIcon} from "../../../helpers/multiLanguage";
import {splitPriceDecimals} from "./currencyHelper";
import {isAllowedForNumberInput} from "../../../helpers/KeyboardShortcutsHelper";
import {maybe} from "../../../helpers/monads";

export default class CurrencyRow extends Component {

  static propTypes = {
    country: PropTypes.string.isRequired,
    countryCurrencyValue: PropTypes.number,
    isFallbackValue: PropTypes.bool.isRequired,
    updateValue: PropTypes.func.isRequired
  };

  constructor(props) {
    super(props);
    this.state = {modified: false};
  }

  // returns float 0 when nothing has ever been entered for this country
  mergeSplittedCurrencyValues() {
    const integerVal = String(this.currencyInteger.value).trim();
    const decimalVal = String(this.currencyDecimals.value).trim();
    const mergedVal = (integerVal === "" ? "0" : integerVal) + "." + (decimalVal === "" ? "00" : decimalVal);
    return parseFloat(mergedVal);
  }

  onKeyDownInput = (e) => {
    if (!isAllowedForNumberInput(e)) {
      e.preventDefault();
    }
  };

  currencyInputChanged = (e) => {
    this.setState({modified: true});
    this.props.updateValue(this.mergeSplittedCurrencyValues());
  };

  handleFocus = (selector) => () => {
    const el = this[selector];
    const l = maybe(el).map(x => x.value.length).getOrElse(0);
    maybe(el).method("setSelectionRange", l, l);
  };

  renderCurrencyValue(value) {
    const splittedValue = splitPriceDecimals(value);

    return (
      <div>
        <input ref={ el => { this.currencyInteger = el; this.handleFocus("currencyInteger")(); }}
               className="currency-input integer" type="text" value={splittedValue[0]}
               onKeyDown={this.onKeyDownInput} onChange={this.currencyInputChanged}
               onFocus={this.handleFocus("currencyInteger")}
        />
        <span className="delimiter">,</span>
        <input ref={ el => { this.currencyDecimals = el; this.handleFocus("currencyDecimals")(); }}
               onChange={this.currencyInputChanged} className="currency-input decimals"
               type="text" value={splittedValue[1]}
               onKeyDown={this.onKeyDownInput}
               onFocus={this.handleFocus("currencyDecimals")}
        />
      </div>
    );
  }

  render() {
    const {country, countryCurrencyValue, isFallbackValue} = this.props;
    const currencyCode = getCurrencyCode(country);
    let currencyValue = this.renderCurrencyValue(countryCurrencyValue);

    return (
      <div className={`currency-row${(isFallbackValue && !this.state.modified) ? " grey-out" : ""}`}>
        <div className="country-code">{getLanguageOrCountryIcon(country)}</div>
        <div className="currency-value">{currencyValue}</div>
        <div className="currency-code">{currencyCode}</div>
      </div>
    );
  }

}
