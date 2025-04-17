import classNames from "classnames";
import * as f from "lodash/fp";
import PropTypes from "prop-types";
import React, { PureComponent } from "react";
import listensToClickOutside from "react-onclickoutside";
import { Directions } from "../../../constants/TableauxConstants";
import { canUserChangeCell } from "../../../helpers/accessManagementHelper";
import {
  getCurrencyCode,
  getLanguageOrCountryIcon,
  getLocaleDecimalSeparator
} from "../../../helpers/multiLanguage";
import { getCurrencyWithCountry } from "../../cells/currency/currencyHelper";

const PRE_COMMA = "PRE_COMMA";
const POST_COMMA = "POST_COMMA";

class CurrencyItem extends PureComponent {
  static propTypes = {
    cell: PropTypes.object.isRequired,
    countryCode: PropTypes.string.isRequired,
    editing: PropTypes.bool.isRequired,
    toggleEdit: PropTypes.func.isRequired,
    changeActive: PropTypes.func.isRequired,
    isDisabled: PropTypes.bool
  };

  constructor(props) {
    super(props);
    const { countryCode, cell } = this.props;
    this.state = this.getCellValue(countryCode, cell);
  }

  getCellValue = (countryCode, cell) => {
    const hasValue =
      f.isNumber(cell.value[countryCode]) && !isNaN(cell.value[countryCode]);
    const cellValue = (
      getCurrencyWithCountry(cell.value, countryCode, "withFallback") || "0.0"
    ).toString();
    const currencyValue = parseFloat(cellValue) || null;
    const preComma = hasValue ? cellValue.split(".")[0] || "" : "";
    const postComma = hasValue ? cellValue.split(".")[1] || "" : "";
    return {
      preComma,
      postComma,
      currencyValue
    };
  };

  resetValue = cell => {
    this.setState(this.getCellValue(this.props.countryCode, cell));
  };

  handleClickOutside = () => {
    const { editing, toggleEdit, countryCode, cell } = this.props;
    const { currencyValue } = this.state;
    const updateObject =
      editing &&
      currencyValue !==
        getCurrencyWithCountry(cell.value, countryCode, "withFallback")
        ? [countryCode, Math.max(currencyValue, 0)]
        : [];
    toggleEdit(false, updateObject);
  };

  handleClear = () => {
    const { countryCode, toggleEdit } = this.props;
    this.setState({ preComma: "", postComma: "" });
    toggleEdit(false, [countryCode, null]);
  };

  renderEditFields = () => {
    return (
      <div className="currency-input ignore-react-onclickoutside">
        <input
          className="left"
          onChange={this.handleChange(PRE_COMMA)}
          value={this.state.preComma}
          autoFocus
          onKeyDown={this.filterKeyEvents(PRE_COMMA)}
          placeholder="-"
          onClick={e => e.stopPropagation()}
        />
        {getLocaleDecimalSeparator(this.props.langtag)}
        <input
          className="right"
          onChange={this.handleChange(POST_COMMA)}
          value={this.state.postComma}
          onKeyDown={this.filterKeyEvents(POST_COMMA)}
          placeholder="--"
          onClick={e => e.stopPropagation()}
        />
        <button onClick={this.handleClear}>
          <i className="fa fa-trash" />
        </button>
      </div>
    );
  };

  filterKeyEvents = place => event => {
    const { key } = event;
    if (
      (event.ctrlKey || event.metaKey) &&
      f.contains(key, ["c", "v", "a", "r"])
    ) {
      // don't capture system commands
      return;
    }
    const numberKeys = f.map(f.toString, f.range(0, 10));
    if (
      !f.contains(key, [
        ...numberKeys,
        "Backspace",
        "Enter",
        "Escape",
        "Delete",
        "ArrowLeft",
        "ArrowRight",
        "Tab"
      ])
    ) {
      event.preventDefault();
      return;
    }
    if (f.contains(key, ["Tab", "Enter"])) {
      const { currencyValue } = this.state;
      const { countryCode } = this.props;
      if ((key === "Enter" || place === PRE_COMMA) && event.shiftKey) {
        // don't prevent default if shift-tab in post-comma position, so focus changes to pre-comma input
        event.preventDefault();
        event.stopPropagation();
        this.props.changeActive(Directions.DOWN)([countryCode, currencyValue]);
      } else if ((key === "Enter" || place === POST_COMMA) && !event.shiftKey) {
        // don't prevent.. tab... pre-comma... -> ... post-comma...
        event.preventDefault();
        event.stopPropagation();
        this.props.changeActive(Directions.UP)([countryCode, currencyValue]);
      } else {
        event.stopPropagation();
      }
    } else if (
      place === POST_COMMA &&
      f.contains(key, numberKeys) &&
      this.state.postComma.length === 2
    ) {
      // limit comma-value of currency to 2 digits
      event.preventDefault();
    } else if (f.contains(key, ["Escape", "ArrowUp", "ArrowDown"])) {
      event.preventDefault();
      event.stopPropagation();
      this.handleClickOutside();
    }
  };

  handleChange = place => event => {
    const value = event.target.value;
    const preComma =
      place === PRE_COMMA ? f.trimCharsStart("0", value) : this.state.preComma;
    const postComma = place === POST_COMMA ? value : this.state.postComma;
    this.setState({
      preComma: f.isEmpty(preComma) ? "0" : preComma,
      postComma: f.isEmpty(postComma) ? "00" : postComma,
      currencyValue: parseInt(preComma) + parseInt(postComma) / 100
    });
  };

  valueToString = (pre, post) => {
    const hasValue = !f.every(f.isEmpty, [pre, post]);
    const postString = parseInt(post) ? post.toString() : "00";
    const separator = getLocaleDecimalSeparator();
    return hasValue
      ? `${(pre || 0).toString()}${separator}${
          postString.length === 2 ? postString : postString + "0"
        }`
      : `-${separator}--`;
  };

  render() {
    const { cell, countryCode, editing } = this.props;
    const isDisabled =
      this.props.isDisabled || !canUserChangeCell(cell, countryCode);
    const { preComma, postComma } = this.state;
    const currencyString = this.valueToString(preComma, postComma);
    const currencyCode = getCurrencyCode(countryCode);
    const cssClass = classNames("currency-item", {
      "not-set": !cell.value[countryCode] && !editing,
      editing: editing && !isDisabled,
      disabled: isDisabled
    });
    const clickHandler =
      editing && !isDisabled
        ? function() {}
        : () => this.props.toggleEdit(true);
    return (
      <div className={cssClass} onClick={clickHandler}>
        {getLanguageOrCountryIcon(countryCode)}
        <div className="value">
          {editing && !isDisabled ? (
            this.renderEditFields()
          ) : (
            <div className="currency-string">{currencyString}</div>
          )}
        </div>
        <div className="currency-code">{currencyCode}</div>
      </div>
    );
  }
}

export default listensToClickOutside(CurrencyItem);
