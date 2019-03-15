import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import {
  getCurrencyCode,
  getLanguageOrCountryIcon
} from "../../../helpers/multiLanguage";
import { splitPriceDecimals } from "./currencyHelper";
// import {isAllowedForNumberInput} from "../../../helpers/KeyboardShortcutsHelper";
import { maybe } from "../../../helpers/functools";
import f from "lodash/fp";

export default class CurrencyRow extends PureComponent {
  static propTypes = {
    country: PropTypes.string.isRequired,
    countryCurrencyValue: PropTypes.number,
    isFallbackValue: PropTypes.bool.isRequired,
    updateValue: PropTypes.func.isRequired
  };

  constructor(props) {
    super(props);
    this.state = {
      modified: false,
      caretPosition: null,
      caretElement: null
    };
  }

  // returns float 0 when nothing has ever been entered for this country
  mergeSplittedCurrencyValues() {
    const integerVal = String(this.currencyInteger.value).trim();
    const decimalVal = String(this.currencyDecimals.value).trim();
    const mergedVal =
      (integerVal === "" ? "0" : integerVal) +
      "." +
      (decimalVal === "" ? "00" : decimalVal);
    return parseFloat(mergedVal);
  }

  // onKeyDownInput = (e) => {
  //   if (!isAllowedForNumberInput(e)) {
  //     this.setState({caretPosition: null});
  //     e.preventDefault();
  //   } else {
  //     const input = e.target;
  //     const modifier = f.cond([
  //       [f.eq("Backspace"), f.always(-1)],
  //       [f.eq("Delete"), f.always(0)],
  //       [f.inRange("0", "9"), f.always(1)],
  //       [f.stubTrue, f.always(null)]
  //     ])(e.key);
  //     const caretPosition = (f.isNil(modifier))
  //       ? null
  //       : input.selectionStart + modifier;
  //     this.setState({
  //       caretPosition,
  //       caretElement: input
  //     });
  //   }
  // };
  onKeyDownInput = () => console.log("onKeyDownInput");

  currencyInputChanged = e => {
    this.setState({ modified: true });
    this.props.updateValue(
      this.props.country,
      this.mergeSplittedCurrencyValues()
    );
    const { caretElement, caretPosition } = this.state;
    if (!f.isNil(caretPosition)) {
      caretElement.setSelectionRange(caretPosition, caretPosition);
    }
  };

  handleFocus = selector => () => {
    const el = this[selector];
    const l = maybe(el)
      .map(x => x.value.length)
      .getOrElse(0);
    maybe(el).method("setSelectionRange", l, l);
  };

  inputRef = (id, el) => {
    this[id] = el;
    this.handleFocus(id);
  };

  currencyIntegerRef = node => this.inputRef("currencyInteger", node);
  currencyDecimalsRef = node => this.inputRef("currencyDecimals", node);

  renderCurrencyValue(value) {
    const splittedValue = splitPriceDecimals(value);

    return (
      <div>
        <input
          ref={this.currencyIntegerRef}
          className="currency-input integer"
          type="text"
          value={splittedValue[0]}
          onKeyDown={this.onKeyDownInput}
          onChange={this.currencyInputChanged}
          onFocus={this.handleFocus("currencyInteger")}
        />
        <span className="delimiter">,</span>
        <input
          ref={this.currencyDecimalsRef}
          onChange={this.currencyInputChanged}
          className="currency-input decimals"
          type="text"
          value={splittedValue[1]}
          onKeyDown={this.onKeyDownInput}
          onFocus={this.handleFocus("currencyDecimals")}
        />
      </div>
    );
  }

  render() {
    const { country, countryCurrencyValue, isFallbackValue } = this.props;
    const currencyCode = getCurrencyCode(country);
    let currencyValue = this.renderCurrencyValue(countryCurrencyValue);

    return (
      <div
        className={`currency-row${
          isFallbackValue && !this.state.modified ? " grey-out" : ""
        }`}
      >
        <div className="country-code">{getLanguageOrCountryIcon(country)}</div>
        <div className="currency-value">{currencyValue}</div>
        <div className="currency-code">{currencyCode}</div>
      </div>
    );
  }
}
