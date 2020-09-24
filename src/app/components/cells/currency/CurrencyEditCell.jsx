import React from "react";
import CurrencyRow from "./CurrencyRow";
import {
  getCurrencyWithCountry,
  maybeAddZeroToDecimals
} from "./currencyHelper";
import { canUserChangeCountryTypeCell } from "../../../helpers/accessManagementHelper";
import f from "lodash/fp";
import PropTypes from "prop-types";

export default class CurrencyEditCell extends React.PureComponent {
  static propTypes = {
    saveCell: PropTypes.func.isRequired,
    exitCell: PropTypes.func.isRequired,
    onClickOutside: PropTypes.func.isRequired,
    setCellKeyboardShortcuts: PropTypes.func.isRequired
  };

  handleClickOutside = evt => this.props.onClickOutside(evt);

  constructor(props) {
    super(props);

    this.state = {
      currencyValues: f.mapValues(
        f.compose(
          maybeAddZeroToDecimals,
          this.splitFloat
        ),
        props.cell.value
      )
    };
  }

  componentDidMount() {
    this.props.setCellKeyboardShortcuts({
      always: event => {
        event.stopPropagation();
      },
      enter: event => {
        event.preventDefault();
        event.stopPropagation();
        this.props.exitCell();
      },
      escape: event => {
        event.preventDefault();
        this.props.exitCell();
      }
    });
  }

  splitFloat = f.compose(
    splittedValue =>
      splittedValue.length === 1 ? f.concat(splittedValue, "") : splittedValue,
    f.split("."),
    f.toString
  );

  saveCell = () => {
    const { cell, saveCell } = this.props;
    const { currencyValues } = this.state;
    const numericCurrencyValues = f.mapValues(
      f.compose(
        f.toNumber,
        f.join("."),
        f.map(stringVal => (f.isEmpty(stringVal) ? "0" : stringVal))
      ),
      currencyValues
    );

    if (f.equals(cell.value, numericCurrencyValues)) {
      return;
    }

    const updateObj = f.pickBy(
      (val, ctry) => val !== cell.value[ctry],
      numericCurrencyValues
    );
    saveCell(updateObj);
  };

  componentWillUnmount() {
    // Important to clean up the keyboard shortcuts
    this.props.setCellKeyboardShortcuts({});
    // call every save method of children
    this.saveCell();
  }

  updateCurrencyValue = (country, value) => {
    const { currencyValues } = this.state;

    const newValue = f.assoc(country, value, currencyValues);
    this.setState({ currencyValues: newValue });
  };

  catchEvent = event => {
    event.stopPropagation();
  };

  render() {
    const { cell } = this.props;
    const { column } = cell;
    const { countryCodes } = column;
    const { currencyValues } = this.state;

    const currencyRows = countryCodes.map((countryCode, index) => {
      const currencyValue = getCurrencyWithCountry(
        currencyValues,
        countryCode,
        "withFallback"
      );

      const isDisabled = !canUserChangeCountryTypeCell(cell, countryCode);

      return (
        <CurrencyRow
          key={index}
          country={countryCode}
          isFallbackValue={!f.get(["value", countryCode], cell)}
          countryCurrencyValue={currencyValue || ["", ""]}
          updateValue={this.updateCurrencyValue}
          isDisabled={isDisabled}
        />
      );
    });

    return (
      <div className="cell-currency-rows" onClick={this.catchEvent}>
        <div className="rows-container">{currencyRows}</div>
      </div>
    );
  }
}
