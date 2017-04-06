import React, {Component, PropTypes} from "react";
import {getCurrencyWithCountry} from "../../cells/currency/currencyHelper";
import {getCurrencyCode, getLanguageOrCountryIcon} from "../../../helpers/multiLanguage";
import classNames from "classnames";
import listensToClickOutside from "react-onclickoutside";
import * as f from "lodash/fp";

const PRE_COMMA = "PRE_COMMA";
const POST_COMMA = "POST_COMMA";

@listensToClickOutside
class CurrencyItem extends Component {
  static propTypes = {
    cell: PropTypes.object.isRequired,
    countryCode: PropTypes.string.isRequired,
    editing: PropTypes.bool.isRequired,
    toggleEdit: PropTypes.func.isRequired
  };

  constructor(props) {
    super(props);
    const {countryCode, cell} = this.props;
    const cellValue = (getCurrencyWithCountry(cell.value, countryCode) || "0.0").toString();
    const currencyValue = parseFloat(cellValue) || 0;
    const preComma = cellValue.split(".")[0] || "";
    const postComma = cellValue.split(".")[1] || "";
    this.state = {
      preComma,
      postComma,
      currencyValue
    };
  }

  handleClickOutside = event => {
    const {editing, toggleEdit, countryCode, cell} = this.props;
    const {currencyValue} = this.state;
    const updateObject = (editing && currencyValue !== getCurrencyWithCountry(cell.value, countryCode))
      ? [countryCode, Math.max(currencyValue, 0)]
      : [];
    toggleEdit(false, updateObject);
  };

  renderEditFields = () => {
    return (
      <div className="currency-input ignore-react-onclickoutside">
        <input className="left"
               onChange={this.handleChange(PRE_COMMA)}
               value={this.state.preComma}
               autoFocus
               onKeyDown={this.filterKeyEvents(PRE_COMMA)}
               placeholder="0"
        />
        ,
        <input className="right"
               onChange={this.handleChange(POST_COMMA)}
               value={this.state.postComma}
               onKeyDown={this.filterKeyEvents(POST_COMMA)}
               placeholder="00"
        />
      </div>
    );
  };

  filterKeyEvents = place => event => {
    const {key} = event;
    const numberKeys = f.map(f.toString, f.range(0, 10));
    if (!f.contains(key, [...numberKeys, "Backspace", "Enter", "Escape", "Delete", "ArrowLeft", "ArrowRight"])) {
      event.preventDefault();
      return;
    }
    if (place === POST_COMMA && f.contains(key, numberKeys)
      && this.state.postComma.length === 2) {
      event.preventDefault();
      return;
    }
    if (f.contains(key, ["Enter", "Escape"])) {
      event.preventDefault();
      event.stopPropagation();
      this.handleClickOutside();
      document.getElementById("overlay").focus();
    }
  };

  handleChange = place => event => {
    const value = event.target.value;
    const preComma = (place === PRE_COMMA) ? value : this.state.preComma;
    const postComma = (place === POST_COMMA) ? value : this.state.postComma;
    this.setState({
      preComma,
      postComma,
      currencyValue: parseInt(preComma) + parseInt(postComma) / 100
    });
  };

  valueToString = (pre, post) => {
    const postString = (parseInt(post)) ? post.toString() : "00";
    return `${(pre || 0).toString()},${(postString.length === 2) ? postString : postString + "0"}`;
  };

  render() {
    const {countryCode, editing} = this.props;
    const {preComma, postComma, currencyValue} = this.state;
    const currencyString = this.valueToString(preComma, postComma);
    const currencyCode = getCurrencyCode(countryCode);
    const cssClass = classNames(
      "currency-item",
      {
        "not-set": !currencyValue && !editing,
        "editing": editing
      }
    );
    const clickHandler = (editing)
      ? function () {
      }
      : () => this.props.toggleEdit(true);
    return (
      <div className={cssClass} onClick={clickHandler}>
        {getLanguageOrCountryIcon(countryCode)}
        <div className="value">
          {(editing)
            ? this.renderEditFields()
            : <div className="currency-string">{currencyString}</div>
          }
        </div>
        <div className="currency-code">{currencyCode}</div>
      </div>
    );
  }
}

export default CurrencyItem;
