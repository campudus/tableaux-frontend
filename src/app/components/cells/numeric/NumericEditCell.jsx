import { Directions } from "../../../constants/TableauxConstants";
import React from "react";
import listensToClickOutside from "react-onclickoutside";
import { maybe } from "../../../helpers/functools";
import PropTypes from "prop-types";
import { filterAllowedKeys } from "../numericInput";

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
      up: event => {
        event.preventDefault();
        this.doneEditing(event);
      },
      down: event => {
        event.preventDefault();
        this.doneEditing(event);
      },
      left: event => {
        event.stopPropagation();
      },
      right: event => {
        event.stopPropagation();
      },
      enter: event => {
        this.doneEditing(event);
        //        ActionCreator.selectNextCell(Directions.DOWN);
      },
      navigation: event => {
        this.doneEditing(event);
      }
    };
  };

  handleClickOutside = event => {
    this.doneEditing(event);
  };

  filterKeys = event => {
    filterAllowedKeys(event.target.value)(event);
  };

  formatNumberCell = input => {
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
    input.value = result === null ? "" : result;
    return result;
  };

  doneEditing = () => {
    this.props.onSave(this.formatNumberCell(this.input));
  };

  getValue = () => {
    const { value, isMultiLanguage, langtag } = this.props;
    return (isMultiLanguage ? value[langtag] : value) || "";
  };

  correctNumberFormat = value => {
    const result = String(value)
      .replace(/,/g, ".")
      .match(/\d+(\.\d*)?/);
    return (result && result[0]) || "";
  };

  onChangeHandler = e => {
    const curr = e.target.value;
    const formattedNumber = this.correctNumberFormat(curr);

    if (formattedNumber.length > this.MAX_DIGIT_LENGTH) {
      alert("Numbers can't be greater than 15 decimal values.");
      e.target.value = formattedNumber.substring(0, this.MAX_DIGIT_LENGTH);
    }
  };

  moveCaretToEnd = () => {
    const l = this.getValue().toString().length;
    maybe(this.input).method("setSelectionRange", l, l);
  };

  render = () => {
    return (
      <div className={"cell-content editing"}>
        <input
          autoFocus
          onFocus={this.moveCaretToEnd}
          className="input"
          name={this.inputName}
          defaultValue={this.getValue()}
          onChange={this.onChangeHandler}
          onKeyDown={this.filterKeys}
          ref={input => {
            this.input = input;
            this.moveCaretToEnd();
          }}
        />
      </div>
    );
  };
}

NumericEditCell.propTypes = {
  langtag: PropTypes.string.isRequired,
  onSave: PropTypes.func.isRequired,
  setCellKeyboardShortcuts: PropTypes.func
};

module.exports = NumericEditCell;
