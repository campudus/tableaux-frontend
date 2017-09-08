import React from "react";
import ReactDOM from "react-dom";
import {getCountryOfLangtag, getCurrencyCode} from "../../../helpers/multiLanguage";
import CurrencyEditCell from "./CurrencyEditCell";
import ActionCreator from "../../../actions/ActionCreator";
import {getCurrencyWithCountry, splitPriceDecimals} from "./currencyHelper";
import onClickOutside from "react-onclickoutside";
import {translate} from "react-i18next";
import PropTypes from "prop-types";

const CurrencyEditCellWithClickOutside = onClickOutside(CurrencyEditCell);

@translate(["table"])
export default class CurrencyCell extends React.PureComponent {
  static propTypes = {
    cell: PropTypes.object.isRequired,
    langtag: PropTypes.string.isRequired,
    selected: PropTypes.bool.isRequired,
    editing: PropTypes.bool.isRequired,
    setCellKeyboardShortcuts: PropTypes.func
  };

  CurrencyCellDOMNode = null;

  componentDidMount() {
    this.CurrencyCellDOMNode = ReactDOM.findDOMNode(this);
  }

  static scrollHandler(event) {
    // prevents the table scroll event
    event.stopPropagation();
  }

  saveCurrencyCell = (valuesToSave) => {
    ActionCreator.changeCell(this.props.cell, valuesToSave);
  };

  exitCurrencyCell = () => {
    ActionCreator.toggleCellEditing({editing: false});
  };

  handleClickOutside = (event) => {
    // prevents from closing editCell when clicking on the scrollbar on windows
    if (!this.CurrencyCellDOMNode.contains(event.target)) {
      this.exitCurrencyCell();
    }
  };

  renderPrice(currencyValues, country) {
    const currencyValue = getCurrencyWithCountry(currencyValues, country, "withFallback");
    const splittedValueAsString = splitPriceDecimals(currencyValue);
    const currencyCode = getCurrencyCode(country);
    const {cell, t} = this.props;
    if (!currencyCode) {
      return (
        <div className="currency-wrapper">
          <span className="currency-no-country">
            {t("error_language_is_no_country")}
            <i className="open-country fa fa-angle-down" />
          </span>
        </div>
      );
    }

    return (
      <div className={`currency-wrapper${(cell.value[country]) ? "" : " grey-out"}`}>
        <span className="currency-value">
          {splittedValueAsString[0]}
        </span>
        <span className="currency-value-decimals">
          ,{splittedValueAsString[1]}
        </span>
        <span
          className="currency-code">{currencyCode}</span>
        <i className="open-country fa fa-angle-down" />
      </div>

    );
  }

  render() {
    const {langtag, editing, cell, setCellKeyboardShortcuts} = this.props;
    const currencyValues = cell.value;
    const country = getCountryOfLangtag(langtag);
    const currencyCellMarkup = (editing)
      ? (
        <CurrencyEditCellWithClickOutside
          cell={cell}
          setCellKeyboardShortcuts={setCellKeyboardShortcuts}
          onClickOutside={this.handleClickOutside}
          saveCell={this.saveCurrencyCell}
          exitCell={this.exitCurrencyCell}
        />
      )
      : this.renderPrice(currencyValues, country);

    return (
      <div className="cell-content" onScroll={this.scrollHandler}>
        {currencyCellMarkup}
      </div>
    );
  }
}
