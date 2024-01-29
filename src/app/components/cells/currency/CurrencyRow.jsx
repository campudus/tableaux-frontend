import React, { PureComponent } from "react";
import f from "lodash/fp";
import classNames from "classnames";

import PropTypes from "prop-types";

import {
  getCurrencyCode,
  getLanguageOrCountryIcon,
  getLocaleDecimalSeparator
} from "../../../helpers/multiLanguage";
import { isAllowedForNumberInput } from "../../../helpers/KeyboardShortcutsHelper";
import { maybe } from "../../../helpers/functools";

export default class CurrencyRow extends PureComponent {
  static propTypes = {
    country: PropTypes.string.isRequired,
    countryCurrencyValue: PropTypes.arrayOf(PropTypes.string),
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

  onKeyDownInput = e => {
    if (!isAllowedForNumberInput(e)) {
      this.setState({ caretPosition: null });
      e.preventDefault();
    } else {
      const input = e.target;
      const modifier = f.cond([
        [f.eq("Backspace"), f.always(-1)],
        [f.eq("Delete"), f.always(0)],
        [f.inRange("0", "9"), f.always(1)],
        [f.stubTrue, f.always(null)]
      ])(e.key);
      const caretPosition = f.isNil(modifier)
        ? null
        : input.selectionStart + modifier;
      this.setState({
        caretPosition,
        caretElement: input
      });
    }
  };

  currencyInputChanged = () => {
    this.setState({ modified: true });
    this.props.updateValue(this.props.country, [
      this.currencyInteger.value,
      this.currencyDecimals.value
    ]);
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
    const { isDisabled } = this.props;

    return (
      <div>
        <input
          ref={this.currencyIntegerRef}
          className="currency-input integer"
          type="text"
          value={value[0]}
          onKeyDown={this.onKeyDownInput}
          onChange={this.currencyInputChanged}
          onFocus={this.handleFocus("currencyInteger")}
          disabled={isDisabled}
          placeholder="0"
        />
        <span className="delimiter">{getLocaleDecimalSeparator()}</span>
        <input
          ref={this.currencyDecimalsRef}
          onChange={this.currencyInputChanged}
          className="currency-input decimals"
          type="text"
          value={value[1]}
          onKeyDown={this.onKeyDownInput}
          onFocus={this.handleFocus("currencyDecimals")}
          disabled={isDisabled}
          placeholder="00"
          maxLength="2"
        />
      </div>
    );
  }

  render() {
    const {
      country,
      countryCurrencyValue,
      isFallbackValue,
      isDisabled
    } = this.props;

    const currencyCode = getCurrencyCode(country);

    const currencyValue = this.renderCurrencyValue(countryCurrencyValue);

    const rowClass = classNames("currency-row", {
      "grey-out": isFallbackValue && !this.state.modified,
      disabled: isDisabled
    });

    return (
      <div className={rowClass}>
        <div className="country-code">{getLanguageOrCountryIcon(country)}</div>
        <div className="currency-value">{currencyValue}</div>
        <div className="currency-code">{currencyCode}</div>
      </div>
    );
  }
}
