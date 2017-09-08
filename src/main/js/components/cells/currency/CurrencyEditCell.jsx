import React from "react";
import CurrencyRow from "./CurrencyRow";
import {getCurrencyWithCountry} from "./currencyHelper";
import * as f from "lodash/fp";
import PropTypes from "prop-types";

export default class CurrencyEditCell extends React.PureComponent {
  static propTypes = {
    cell: PropTypes.object.isRequired,
    saveCell: PropTypes.func.isRequired,
    exitCell: PropTypes.func.isRequired,
    onClickOutside: PropTypes.func.isRequired,
    setCellKeyboardShortcuts: PropTypes.func.isRequired
  };

  handleClickOutside = (evt) => this.props.onClickOutside(evt);

  constructor(props) {
    super(props);
    this.state = {
      currencyValues: props.cell.value
    };
  }

  componentDidMount() {
    this.props.setCellKeyboardShortcuts({
      always: (event) => {
        event.stopPropagation();
      },
      enter: (event) => {
        event.preventDefault();
        event.stopPropagation();
        this.props.exitCell();
      },
      escape: (event) => {
        event.preventDefault();
        this.props.exitCell();
      }
    });
  }

  saveCell = () => {
    const {cell, saveCell} = this.props;
    const {currencyValues} = this.state;

    if (f.equals(cell.value, currencyValues)) {
      return;
    }

    const updateObj = f.pickBy(
      (val, ctry) => val !== cell.value[ctry],
      currencyValues
    );
    saveCell(updateObj);
  };

  componentWillUnmount() {
    // Important to clean up the keyboard shortcuts
    this.props.setCellKeyboardShortcuts({});
    // call every save method of childs
    this.saveCell();
  }

  updateCurrencyValue = (country, value) => {
    const {currencyValues} = this.state;
    const newValue = f.assoc(country, value, currencyValues);
    this.setState({currencyValues: newValue});
  };

  render() {
    const {cell} = this.props;
    const {column} = cell;
    const {countryCodes} = column;
    const {currencyValues} = this.state;

    const currencyRows = countryCodes.map(
      (countryCode, index) => {
        const currencyValue = getCurrencyWithCountry(currencyValues, countryCode, "withFallback");
        return <CurrencyRow key={index}
          country={countryCode}
          isFallbackValue={!f.get(["value", countryCode], cell)}
          countryCurrencyValue={currencyValue}
          updateValue={this.updateCurrencyValue}
        />;
      }
    );

    return (
      <div className="cell-currency-rows" onClick={e => { e.stopPropagation(); }}>
        {currencyRows}
      </div>
    );
  }
}
