import React, {Component, PropTypes} from "react";
import {getCurrencyWithCountry} from "../../cells/currency/currencyHelper";
import {getCurrencyCode, getLanguageOrCountryIcon} from "../../../helpers/multiLanguage";
import classNames from "classnames";
import listensToClickOutside from "react-onclickoutside";
import KeyboardShortcutsHelper from "../../../helpers/KeyboardShortcutsHelper";

const EMPTY_STRING = "---";

@listensToClickOutside
class CurrencyItem extends Component {
  static propTypes = {
    cell: PropTypes.object.isRequired,
    countryCode: PropTypes.string.isRequired,
    editing: PropTypes.bool.isRequired,
    toggleEdit: PropTypes.func.isRequired
  };

  getKeyboardShortcuts = () => {
    const catchEventAnd = fn => event => {
      event.stopPropagation();
      fn(event);
      document.getElementById("overlay").focus();
    };
    return {
      enter: catchEventAnd(this.handleClickOutside),
      escape: catchEventAnd(this.handleClickOutside)
    };
  };

  constructor(props) {
    super(props);
    const {countryCode, cell} = this.props;
    const currencyValue = getCurrencyWithCountry(cell.value, countryCode);
    this.state = {currencyValue: parseInt(currencyValue) || 0};
  }

  handleClickOutside = event => {
    const {editing, toggleEdit, countryCode, cell} = this.props;
    const {currencyValue} = this.state;
    const updateObject = (editing && currencyValue !== getCurrencyWithCountry(cell.value, countryCode))
      ? [countryCode, Math.max(currencyValue, 0)]
      : [];
    toggleEdit(false, updateObject);
  };

  handleChange = event => {
    this.setState({currencyValue: Math.max(parseInt(this.input.value) || 0, 0)});
  };

  render() {
    const {countryCode, editing} = this.props;
    const currencyValue = this.state.currencyValue;
    const currencyCode = getCurrencyCode(countryCode);
    const cssClass = classNames(
      "currency-item",
      {
        "not-set": !currencyValue && !editing,
        "editing": editing
      }
    );
    const clickHandler = (editing)
      ? function(){}
      : () => this.props.toggleEdit(true);
    return (
      <div className={cssClass} onClick={clickHandler}>
        {getLanguageOrCountryIcon(countryCode)}
        {(editing)
          ? <input type="number"
                   className="currency-input"
                   onChange={this.handleChange}
                   value={currencyValue}
                   autoFocus
                   ref={input => this.input = input}
                   onKeyDown={KeyboardShortcutsHelper.onKeyboardShortcut(this.getKeyboardShortcuts)}
          />
          : (currencyValue || EMPTY_STRING) + " "
        }
        {currencyCode}
      </div>
    );
  }
}

export default CurrencyItem;