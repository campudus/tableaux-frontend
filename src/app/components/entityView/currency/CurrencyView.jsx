import React, { Component } from "react";
import CurrencyItem from "./CurrencyItem";
import * as f from "lodash/fp";
import KeyboardShortcutsHelper from "../../../helpers/KeyboardShortcutsHelper";
import { Directions } from "../../../constants/TableauxConstants";
import { isLocked } from "../../../helpers/annotationHelper";
import askForSessionUnlock from "../../helperComponents/SessionUnlockDialog";
import PropTypes from "prop-types";

class CurrencyView extends Component {
  constructor(props) {
    super(props);
    const { countryCodes } = props.cell.column;
    this.state = { editing: f.range(0, countryCodes.length).map(f.stubFalse) };
  }

  static propTypes = {
    langtag: PropTypes.string.isRequired,
    cell: PropTypes.object.isRequired,
    funcs: PropTypes.object.isRequired,
    thisUserCantEdit: PropTypes.bool
  };

  getCurrencyValues = cell => {
    const { column } = cell;
    const { countryCodes } = column;
    const { editing } = this.state;

    return countryCodes.map((countryCode, index) => {
      return (
        <CurrencyItem
          key={countryCode}
          cell={cell}
          countryCode={countryCode}
          editing={editing[index]}
          toggleEdit={this.setEditing(index)}
          isDisabled={this.props.thisUserCantEdit}
          changeActive={this.changeActive(index)}
        />
      );
    });
  };

  setEditing = el => (to, [country, editValue] = []) => {
    const { editing } = this.state;
    const { cell, value, actions } = this.props;
    const isEditing =
      to === true
        ? f.assoc(el, true, f.map(f.stubFalse, editing))
        : f.set(el, false, editing);
    if (f.isString(country) && (f.isNumber(editValue) || editValue === null)) {
      const newValue = { ...value, [country]: editValue };
      actions.changeCellValue({ cell, oldValue: value, newValue });
    }
    if (editing[el] !== to) {
      this.setState({ editing: isEditing });
    }
  };

  getKeyCommands = () => {
    return {
      tab: evt => {
        if (f.any(f.identity, this.state.editing)) {
          evt.stopPropagation();
          evt.preventDefault();
        }
      },
      enter: evt => {
        const { row } = this.props.cell;
        if (isLocked(row)) {
          askForSessionUnlock(row);
          return;
        }
        if (!f.any(f.identity, this.state.editing)) {
          this.setEditing(0)(true);
        }
        evt.stopPropagation();
        evt.preventDefault();
      }
    };
  };

  changeActive = id => dir => values => {
    const N = this.props.cell.column.countryCodes.length;
    const next = (id + N + (dir === Directions.UP ? 1 : -1)) % N;
    this.setEditing(next)(true, values);
  };

  render() {
    const { cell, funcs } = this.props;
    const currencyRows = this.getCurrencyValues(cell, false);

    return (
      <div>
        <div
          className="item-content currency"
          ref={el => {
            funcs.register(el);
          }}
          tabIndex={1}
          onKeyDown={KeyboardShortcutsHelper.onKeyboardShortcut(
            this.getKeyCommands
          )}
        >
          {currencyRows}
        </div>
        {this.props.children}
      </div>
    );
  }
}

export default CurrencyView;
