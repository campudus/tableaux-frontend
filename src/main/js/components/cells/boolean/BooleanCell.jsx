import React, {Component, PropTypes} from "react";
import ActionCreator from "../../../actions/ActionCreator";
import connectToAmpersand from "../../helperComponents/connectToAmpersand";

@connectToAmpersand
class BooleanCell extends Component {

  static propTypes = {
    cell: PropTypes.object.isRequired,
    langtag: PropTypes.string.isRequired,
    selected: PropTypes.bool.isRequired,
    setCellKeyboardShortcuts: PropTypes.func
  };

  handleEditDone = (newValue) => {
    const {cell, langtag} = this.props;
    const valueToSave = (cell.isMultiLanguage)
      ? {[langtag]: newValue}
      : newValue;
    ActionCreator.changeCell(cell, valueToSave);
  };

  getCheckboxValue = () => {
    const {cell, langtag} = this.props;
    return !!((cell.isMultiLanguage) ? cell.value[langtag] : cell.value);
  };

  toggleCheckboxValue = () => {
    if (this.props.selected) {
      this.handleEditDone(!this.getCheckboxValue());
    }
  };

  render() {
    return (
      <div className={"cell-content"} onClick={this.toggleCheckboxValue}>
        <input className="checkbox" type="checkbox"
               checked={this.getCheckboxValue()}
               readOnly="readOnly" />
      </div>
    );
  }
}

module.exports = BooleanCell;
