import React, {Component, PropTypes} from "react";
import {getCurrencyWithCountry} from "../../cells/currency/currencyHelper";
import {getCurrencyCode, getLanguageOrCountryIcon} from "../../../helpers/multiLanguage";
import classNames from "classnames";
import listensToClickOutside from "react-onclickoutside";
import * as f from "lodash/fp";
import {hasUserAccessToCountryCode} from "../../../helpers/accessManagementHelper";
import {Directions} from "../../../constants/TableauxConstants";

const PRE_COMMA = "PRE_COMMA";
const POST_COMMA = "POST_COMMA";

@listensToClickOutside
class CurrencyItem extends Component {
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
               onClick={e => e.stopPropagation()}
        />
        ,
        <input className="right"
               onChange={this.handleChange(POST_COMMA)}
               value={this.state.postComma}
               onKeyDown={this.filterKeyEvents(POST_COMMA)}
               placeholder="00"
               onClick={e => e.stopPropagation()}
        />
      </div>
    );
  };

  filterKeyEvents = place => event => {
    const {key} = event;
    if ((event.ctrlKey || event.metaKey) && f.contains(key, ["c", "v", "a", "r"])) { // don't capture system commands
      return;
    }
    const numberKeys = f.map(f.toString, f.range(0, 10));
    if (!f.contains(key, [...numberKeys, "Backspace", "Enter", "Escape", "Delete", "ArrowLeft", "ArrowRight", "Tab"])) {
      event.preventDefault();
      return;
    }
    if (f.contains(key, ["Tab", "Enter"])) {
      const {currencyValue} = this.state;
      const {countryCode} = this.props;
      if ((key === "Enter" || place === PRE_COMMA) && event.shiftKey) { // don't prevent default if shift-tab in post-comma position, so focus changes to pre-comma input
        event.preventDefault();
        event.stopPropagation();
        this.props.changeActive(Directions.DOWN)([countryCode, currencyValue]);
      } else if ((key === "Enter" || place === POST_COMMA) && !event.shiftKey) { // don't prevent.. tab... pre-comma... -> ... post-comma...
        event.preventDefault();
        event.stopPropagation();
        this.props.changeActive(Directions.UP)([countryCode, currencyValue]);
      } else {
        event.stopPropagation();
      }
    } else if (place === POST_COMMA && f.contains(key, numberKeys)
      && this.state.postComma.length === 2) { // limit comma-value of currency to 2 digits
      event.preventDefault();
    } else if (f.contains(key, ["Escape", "ArrowUp", "ArrowDown"])) {
      event.preventDefault();
      event.stopPropagation();
      this.handleClickOutside();
    }
  };

  handleChange = place => event => {
    const value = event.target.value;
    const preComma = (place === PRE_COMMA) ? f.trimCharsStart("0", value) : this.state.preComma;
    const postComma = (place === POST_COMMA) ? value : this.state.postComma;
    this.setState({
      preComma: (f.isEmpty(preComma)) ? "0" : preComma,
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
    const isDisabled = this.props.isDisabled || !hasUserAccessToCountryCode(countryCode);
    const {preComma, postComma, currencyValue} = this.state;
    const currencyString = this.valueToString(preComma, postComma);
    const currencyCode = getCurrencyCode(countryCode);
    const cssClass = classNames(
      "currency-item",
      {
        "not-set": !currencyValue && !editing,
        "editing": editing && !isDisabled,
        "disabled": isDisabled
      }
    );
    const clickHandler = (editing && !isDisabled)
      ? function () {
      }
      : () => this.props.toggleEdit(true);
    return (
      <div className={cssClass} onClick={clickHandler}>
        {getLanguageOrCountryIcon(countryCode)}
        <div className="value">
          {(editing && !isDisabled)
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
