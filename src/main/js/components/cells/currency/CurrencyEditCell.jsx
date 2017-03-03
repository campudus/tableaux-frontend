import React from "react";
import _ from "lodash";
import OverlayHeadRowIdentificator from "../../overlay/OverlayHeadRowIdentificator.jsx";
import CurrencyRow from "./CurrencyRow";
import {getCurrencyWithCountry} from "./currencyHelper";

export default class CurrencyEditCell extends React.Component {

  // holds all the ref names of the currency row children
  currencyRowNames = null;

  static propTypes = {
    cell: React.PropTypes.object.isRequired,
    currencies: React.PropTypes.object.isRequired,
    saveCell: React.PropTypes.func.isRequired,
    exitCell: React.PropTypes.func.isRequired,
    onClickOutside: React.PropTypes.func.isRequired,
    setCellKeyboardShortcuts: React.PropTypes.func.isRequired
  };

  constructor(props) {
    super(props);
    this.handleClickOutside = props.onClickOutside;
  }

  componentDidMount() {
    this.buildCurrencyRowRefNames();
    this.props.setCellKeyboardShortcuts({
      always: (event) => {
        event.stopPropagation();
      },
      enter: (event) => {
        event.preventDefault();
        console.log("hitting enter");
        this.props.exitCell();
      },
      escape: (event) => {
        event.preventDefault();
        this.props.exitCell();
      }
    });
  }

  saveCell = () => {
    let valuesToSave = {};
    _.forEach(this.currencyRowNames, (refName) => {
      const currencyRowValue = this.refs[refName].saveThisCurrency();
      if (currencyRowValue !== null) {
        _.assign(valuesToSave, currencyRowValue);
      }
    });

    if (!_.isEmpty(valuesToSave)) {
      this.props.saveCell(valuesToSave);
    }
  }

  componentWillUnmount() {
    // Important to clean up the keyboard shortcuts
    this.props.setCellKeyboardShortcuts({});
    // call every save method of childs
    this.saveCell();
  }

  buildCurrencyRowRefNames() {
    const countryCodes = this.props.cell.column.countryCodes;
    this.currencyRowNames = [];
    _.forEach(countryCodes, (countryCode, index) => {
      this.currencyRowNames.push(this.getCurrencyRowName(countryCode));
    });
  }

  getCurrencyRowName(countryCode) {
    return "currency-" + countryCode;
  }

  render() {
    const {cell, currencies} = this.props;
    const {column} = cell;
    const {countryCodes} = column;

    console.log("currencyEditcell currencies: ", currencies, "countryCodes:", countryCodes);

    const currencyRows = countryCodes.map((countryCode, index) => {
      const currencyValue = getCurrencyWithCountry(currencies, countryCode);
      return <CurrencyRow ref={this.getCurrencyRowName(countryCode)} key={index} country={countryCode}
                          countryCurrencyValue={currencyValue}/>;
    });

    return (
      <div className="cell-currency-rows">
        {currencyRows}
      </div>
    );
  }

}
