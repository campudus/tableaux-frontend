import React from 'react';
import ReactDOM from 'react-dom';
import {getCountryOfLangtag, getCurrencyCode} from '../../../helpers/multiLanguage';
import CurrencyEditCell from './CurrencyEditCell';
import ActionCreator from'../../../actions/ActionCreator';
import {getCurrencyWithCountry, splitPriceDecimals} from './currencyHelper';
import onClickOutside from 'react-onclickoutside';
import {translate} from 'react-i18next';

const CurrencyEditCellWithClickOutside = onClickOutside(CurrencyEditCell);

@translate(['table'])
export default class CurrencyCell extends React.Component {

  static propTypes = {
    cell : React.PropTypes.object.isRequired,
    langtag : React.PropTypes.string.isRequired,
    selected : React.PropTypes.bool.isRequired,
    editing : React.PropTypes.bool.isRequired,
    setCellKeyboardShortcuts : React.PropTypes.func
  };

  CurrencyCellDOMNode = null;

  componentDidMount() {
    this.CurrencyCellDOMNode = ReactDOM.findDOMNode(this);
  }

  constructor(props) {
    super(props);
  }

  scrollHandler(event) {
    //prevents the table scroll event
    event.stopPropagation();
  }

  saveCurrencyCell = (valuesToSave) => {
    console.log("----> i want to save currency values: ", valuesToSave);
    ActionCreator.changeCell(this.props.cell, valuesToSave);
  }

  exitCurrencyCell = () => {
    console.log("exiting cell");
    ActionCreator.toggleCellEditing(false);
  }

  handleClickOutside = (event) => {
    //prevents from closing editCell when clicking on the scrollbar on windows
    if (!this.CurrencyCellDOMNode.contains(event.target)) {
      this.exitCurrencyCell();
    }
  };

  renderPrice(currencyValues, country) {
    const currencyValue = getCurrencyWithCountry(currencyValues, country);
    const splittedValueAsString = splitPriceDecimals(currencyValue);
    const currencyCode = getCurrencyCode(country);
    const {langtag, t} = this.props;
    if (!currencyCode) {
      return (
        <div className="currency-wrapper">
          <span className="currency-no-country">{t('error_language_is_no_country')} <i
            className="open-country fa fa-angle-down"/></span>
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
        <i className="open-country fa fa-angle-down"/>
      </div>

    );

  }

  render() {
    const {selected, langtag, editing, cell, setCellKeyboardShortcuts} = this.props;
    const currencyValues = cell.value;
    const country = getCountryOfLangtag(langtag);
    let currencyCellMarkup;

    if (editing) {
      currencyCellMarkup = <CurrencyEditCellWithClickOutside
        currencies={currencyValues} cell={cell}
        setCellKeyboardShortcuts={setCellKeyboardShortcuts}
        onClickOutside={this.handleClickOutside}
        saveCell={this.saveCurrencyCell}
        exitCell={this.exitCurrencyCell}
      />;
    } else {
      currencyCellMarkup = this.renderPrice(currencyValues, country);
    }

    return (
      <div className="cell-content" onScroll={this.scrollHandler}>
        {currencyCellMarkup}
      </div>
    );

  }

}
