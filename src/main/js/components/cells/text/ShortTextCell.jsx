import React, {Component, PropTypes} from "react";
import ShortTextEditCell from "./ShortTextEditCell";
import ActionCreator from "../../../actions/ActionCreator";
import {isEmpty} from "lodash/fp";

class ShortTextCell extends Component {
  static propTypes = {
    langtag: PropTypes.string.isRequired,
    cell: PropTypes.object.isRequired,
    editing: PropTypes.bool.isRequired,
    contentChanged: PropTypes.func.isRequired,
    setCellKeyboardShortcuts: PropTypes.func
  };

  constructor(props) {
    super(props);
    this.displayName = "ShortTextEditCell";
  }

  handleEditDone = (newValue) => {
    const oldValue = this.getValue();
    if ((isEmpty(newValue) && isEmpty(oldValue)) || newValue === oldValue) {
      return;
    }
    const {cell, cell:{isMultiLanguage}, langtag, contentChanged} = this.props;
    const valueToSave = (isMultiLanguage)
      ? {[langtag]: newValue}
      : newValue;

    cell.save({value: valueToSave}, {patch: true, success: contentChanged(cell, langtag)});
    ActionCreator.toggleCellEditing(false);
  };

  getValue = () => {
    const {cell, cell:{isMultiLanguage}, langtag} = this.props;
    return (isMultiLanguage)
      ? cell.value[langtag]
      : cell.value;
  };

  renderTextCell = (cell, value) => {
    return (
      <div className="cell-content">
        {(value === null) ? "" : value}
      </div>
    );
  };

  render() {
    const {cell, editing} = this.props;

    if (!editing) {
      return this.renderTextCell(cell, this.getValue());
    } else {
      return <ShortTextEditCell cell={cell} langtag={this.props.langtag} onBlur={this.handleEditDone}
                                setCellKeyboardShortcuts={this.props.setCellKeyboardShortcuts}/>;
    }
  }
}

export default ShortTextCell;