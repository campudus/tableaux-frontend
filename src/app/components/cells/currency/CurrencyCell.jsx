import React from "react";
import ReactDOM from "react-dom";
import {
  getCountryOfLangtag,
  getCurrencyCode
} from "../../../helpers/multiLanguage";
import CurrencyEditCell from "./CurrencyEditCell";
import { getCurrencyWithCountry, splitPriceDecimals } from "./currencyHelper";
import onClickOutside from "react-onclickoutside";
import { translate } from "react-i18next";
import PropTypes from "prop-types";
import f from "lodash/fp";

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

  constructor(props) {
    super(props);
    this.state = {
      shiftUp: false,
      domNode: null
    };
  }

  CurrencyCellDOMNode = null;

  componentDidMount() {
    // React ref does not support finding element dimensions
    // eslint-disable-next-line react/no-find-dom-node
    this.CurrencyCellDOMNode = ReactDOM.findDOMNode(this);
  }

  static scrollHandler(event) {
    // prevents the table scroll event
    event.stopPropagation();
  }

  saveCurrencyCell = valuesToSave => {
    const { actions, table, column, row } = this.props;
    actions.changeCellValue({
      tableId: table.id,
      columnId: column.id,
      column,
      rowId: row.id,
      oldValue: this.props.value,
      newValue: valuesToSave
    });
  };

  exitCurrencyCell = () => {
    const { actions, tableId, columnId, rowId } = this.props;
    actions.toggleCellEditing({ tableId, columnId, rowId, editing: false });
  };

  handleClickOutside = () => {
    this.exitCurrencyCell();
  };

  renderPrice(currencyValues, country) {
    const currencyValue = getCurrencyWithCountry(
      currencyValues,
      country,
      "withFallback"
    );
    const splittedValueAsString = splitPriceDecimals(currencyValue);
    const currencyCode = getCurrencyCode(country);
    const { value, t } = this.props;
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

    // TODO: localization
    return (
      <div className={`currency-wrapper${value[country] ? "" : " grey-out"}`}>
        <span className="currency-value">{splittedValueAsString[0]}</span>
        <span className="currency-value-decimals">
          ,{splittedValueAsString[1]}
        </span>
        <span className="currency-code">{currencyCode}</span>
        <i className="open-country fa fa-angle-down" />
      </div>
    );
  }

  getStyle = () => {
    const { shiftUp } = this.state;
    return this.props.editing
      ? {
          top: shiftUp ? -125 : 0,
          bottom: shiftUp ? -45 : -170
        }
      : {
          top: 0,
          bottom: 0
        };
  };

  checkPosition = (domNode = this.state.domNode) => {
    if (f.isNil(domNode)) {
      return;
    }

    if (f.isNil(this.state.domNode)) {
      this.setState({ domNode });
    }

    if (!this.props.editing) {
      return;
    }

    const rect = domNode.getBoundingClientRect();
    const unshiftedBottom = this.state.shiftUp
      ? rect.bottom + 180
      : rect.bottom + 10;
    const needsShiftUp =
      this.props.editing && unshiftedBottom >= window.innerHeight;
    if (needsShiftUp !== this.state.shiftUp) {
      this.setState({ shiftUp: needsShiftUp });
    }
  };

  componentDidUpdate() {
    this.checkPosition();
  }

  render() {
    const {
      langtag,
      editing,
      cell: { value },
      setCellKeyboardShortcuts
    } = this.props;
    const currencyValues = value;
    const country = getCountryOfLangtag(langtag);
    const currencyCellMarkup = editing ? (
      <CurrencyEditCellWithClickOutside
        cell={this.props.cell}
        setCellKeyboardShortcuts={setCellKeyboardShortcuts}
        onClickOutside={this.handleClickOutside}
        saveCell={this.saveCurrencyCell}
        exitCell={this.exitCurrencyCell}
      />
    ) : (
      this.renderPrice(currencyValues, country)
    );

    return (
      <div
        className="cell-content"
        onScroll={this.scrollHandler}
        ref={this.checkPosition}
        style={this.getStyle()}
      >
        {currencyCellMarkup}
      </div>
    );
  }
}
