import React from "react";
import listensToClickOutside from "react-onclickoutside";
import f from "lodash/fp";

import PropTypes from "prop-types";

import NumberInput from "../../helperComponents/NumberInput";

@listensToClickOutside
class NumericEditCell extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      value: this.getValue()
    };
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
        event.stopPropagation();
      },
      navigation: event => {
        this.doneEditing(event);
      }
    };
  };

  handleClickOutside = event => {
    this.doneEditing(event);
  };

  doneEditing = () => {
    this.props.actions.toggleCellEditing({ editing: false });
    this.props.onSave(this.state.value);
  };

  getValue = () => {
    const { value, isMultiLanguage, langtag } = this.props;
    const intermediateValue = isMultiLanguage ? value[langtag] : value;
    if (f.isNil(intermediateValue) || f.isNaN(intermediateValue)) {
      return "";
    }
    return intermediateValue;
  };

  updateValueState = value => this.setState({ value });

  render = () => {
    const { isYear } = this.props;
    return (
      <div className={"cell-content editing"}>
        <NumberInput
          autoFocus
          onFocus={this.moveCaretToEnd}
          className="input"
          value={this.state.value}
          onChange={this.updateValueState}
          integer={isYear}
          localize={!isYear}
        />
      </div>
    );
  };
}

NumericEditCell.propTypes = {
  langtag: PropTypes.string.isRequired,
  onSave: PropTypes.func.isRequired,
  isYear: PropTypes.bool,
  setCellKeyboardShortcuts: PropTypes.func
};

export default NumericEditCell;
