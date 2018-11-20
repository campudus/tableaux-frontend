import React from "react";
import PropTypes from "prop-types";
// import {openEntityView} from "../../overlay/EntityViewOverlay";
// import connectToAmpersand from "../../helperComponents/connectToAmpersand";
import {isLocked} from "../../../helpers/annotationHelper";
import {compose, lifecycle, pure, withHandlers} from "recompose";

const withFunctionality = compose(
  withHandlers({
    openEditor: (props) => () => {
      const {cell, editing, langtag, selected} = props;
      ((selected || editing) && !isLocked(cell.row))
        ? function(){}//openEntityView(cell.row, langtag, null, null, cell.column)
        : function () {
        };
    }
  }),
  lifecycle({
    componentDidMount() {
      // const {setCellKeyboardShortcuts} = this.props;
      // setCellKeyboardShortcuts({
      //   enter: this.props.openEditor
      // });
    }
  }),
  pure
  // connectToAmpersand,
);

const IdentifierCell = (props) => {
  const {cell, langtag, openEditor} = props;
  return (
    <div className="cell-content" onClick={openEditor}>
      {cell.displayValue[langtag]}
    </div>
  );
};

IdentifierCell.propTypes = {
  langtag: PropTypes.string.isRequired,
  cell: PropTypes.object.isRequired,
  editing: PropTypes.bool.isRequired,
  selected: PropTypes.bool.isRequired,
  setCellKeyboardShortcuts: PropTypes.func.isRequired
};

export default withFunctionality(IdentifierCell);
