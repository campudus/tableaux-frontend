import {Directions} from "../../../constants/TableauxConstants";
import ActionCreator from "../../../actions/ActionCreator";
import React from "react";
import listensToClickOutside from "react-onclickoutside";
import {maybe} from "../../../helpers/functools";

@listensToClickOutside
class NumericEditCell extends React.Component {

  constructor(props) {
    super(props);
    this.MAX_DIGIT_LENGTH = 15;
  }

  componentDidMount = () => {
    this.props.setCellKeyboardShortcuts(this.getKeyboardShortcuts());
  };

  componentWillUnmount = () => {
    this.props.setCellKeyboardShortcuts({});
  };

  getKeyboardShortcuts = () => {
    return {
      up: (event) => {
        event.preventDefault();
        this.doneEditing(event);
      },
      down: (event) => {
        event.preventDefault();
        this.doneEditing(event);
      },
      left: (event) => {
        event.stopPropagation();
      },
      right: (event) => {
        event.stopPropagation();
      },
      enter: (event) => {
        this.doneEditing(event);
        ActionCreator.selectNextCell(Directions.DOWN);
      },
      navigation: (event) => {
        this.doneEditing(event);
      }
    };
  };

  handleClickOutside = (event) => {
    this.doneEditing(event);
  };

  formatNumberCell = (input) => {
    let result = null;
    const curr = input.value;
    const currLength = curr.trim().length;

    if (currLength > this.MAX_DIGIT_LENGTH) {
      throw new Error("MAX_DIGIT_LENGTH reached: " + this.MAX_DIGIT_LENGTH);
    } else if (currLength >= 0) {
      const formattedNumber = this.correctNumberFormat(curr);
      const realNumber = parseFloat(formattedNumber);
      if (!isNaN(realNumber)) {
        result = realNumber;
      }
    }
    input.value = (result === null) ? "" : result;
    return result;
  };

  doneEditing = () => {
    this.props.onSave(this.formatNumberCell(this.input));
  };

  getValue = () => {
    const {cell, langtag} = this.props;
    const value = (cell.isMultiLanguage)
      ? cell.value[langtag]
      : cell.value;

    return value || "";
  };

  correctNumberFormat = (value) => {
    return String(value).replace(/,/g, ".");
  };

  onChangeHandler = (e) => {
    const curr = e.target.value;
    const formattedNumber = this.correctNumberFormat(curr);

    if (formattedNumber.length > this.MAX_DIGIT_LENGTH) {
      alert("Numbers can't be greater than 15 decimal values.");
      e.target.value = formattedNumber.substring(0, this.MAX_DIGIT_LENGTH);
    }
  };

  handleFocus = () => {
    const l = this.getValue().toString().length;
    maybe(this.input).method("setSelectionRange", l, l);
  };

  render = () => {
    return (
      <div className={"cell-content editing"}>
        <input autoFocus type="number"
               onFocus={this.handleFocus}
               className="input"
               name={this.inputName}
               defaultValue={this.getValue()}
               onChange={this.onChangeHandler}
               ref={input => { this.input = input; this.handleFocus(); }}
        />
      </div>
    );
  }
}
NumericEditCell.propTypes = {
  cell: React.PropTypes.object.isRequired,
  langtag: React.PropTypes.string.isRequired,
  onSave: React.PropTypes.func.isRequired,
  setCellKeyboardShortcuts: React.PropTypes.func
};

module.exports = NumericEditCell;
