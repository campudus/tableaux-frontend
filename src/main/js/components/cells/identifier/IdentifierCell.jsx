import React, {PureComponent} from "react";
import PropTypes from "prop-types";
import {openEntityView} from "../../overlay/EntityViewOverlay";
import connectToAmpersand from "../../helperComponents/connectToAmpersand";
import {isLocked} from "../../../helpers/annotationHelper";

class IdentifierCell extends PureComponent {

  openEditor = () => {
    const {cell, editing, langtag, selected} = this.props;
    ((selected || editing) && !isLocked(cell.row))
      ? openEntityView(cell.row, langtag, null, null, cell.column)
      : function () {};
  };

  componentWillMount() {
    const {setCellKeyboardShortcuts} = this.props;
    setCellKeyboardShortcuts({
      enter: this.openEditor
    });
  }

  render() {
    const {cell, langtag} = this.props;
    return (
      <div className='cell-content' onClick={this.openEditor}>
        {cell.displayValue[langtag]}
      </div>
    );
  }
}

IdentifierCell.propTypes = {
  langtag: PropTypes.string.isRequired,
  cell: PropTypes.object.isRequired,
  editing: PropTypes.bool.isRequired,
  selected: PropTypes.bool.isRequired,
  setCellKeyboardShortcuts: PropTypes.func.isRequired
};

module.exports = connectToAmpersand(IdentifierCell);
