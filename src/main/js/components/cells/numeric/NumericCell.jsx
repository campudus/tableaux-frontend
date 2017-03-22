import React, {Component, PropTypes} from "react";
import NumericEditCell from "./NumericEditCell.jsx";
import ActionCreator from "../../../actions/ActionCreator";
import {prop, isEmpty} from "lodash/fp";

class NumericCell extends Component {

  static propTypes = {
    cell: PropTypes.object.isRequired,
    langtag: PropTypes.string.isRequired,
    editing: PropTypes.bool.isRequired,
    setCellKeyboardShortcuts: PropTypes.func
  };

  handleEditDone = (newValue) => {
    const {cell, langtag, contentChanged} = this.props;
    const oldValue = prop(["value", langtag], cell) || prop("value", cell);
    if (newValue === oldValue || (isEmpty(newValue) && isEmpty(oldValue))) {
      return;
    }
    const valueToSave = (cell.isMultiLanguage)
      ? {[langtag]: newValue}
      : newValue;
    cell.save({value: valueToSave}, {success: contentChanged});
    ActionCreator.toggleCellEditing(false);
  };

  render() {
   const {cell, langtag, editing} = this.props;

    if (!editing) {
      return (
        <div className="cell-content">
          {(cell.isMultiLanguage) ? cell.value[langtag] : cell.value}
        </div>
      )
    } else {
      return <NumericEditCell cell={cell}
                              langtag={langtag}
                              onSave={this.handleEditDone}
                              setCellKeyboardShortcuts={this.props.setCellKeyboardShortcuts} />;
    }
  }
}

export default NumericCell;
