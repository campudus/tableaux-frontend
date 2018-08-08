import React from "react";
import PropTypes from "prop-types";
import ActionCreator from "../../../actions/ActionCreator";
import f, {isEmpty} from "lodash/fp";
import TextCell from "./TextCell";
import changeCell from "../../../models/helpers/changeCell";
import {branch, compose, pure, renderComponent, withHandlers} from "recompose";
import SelectableShortText from "./SelectableShortText";

const withEditFn = withHandlers({
  handleEditDone: (props) => (newValue) => {
    const oldValue = props.value;
    const {contentChanged, cell, langtag} = props;
    if ((isEmpty(newValue) && isEmpty(oldValue)) || newValue === oldValue) {
      ActionCreator.toggleCellEditing({editing: false});
      return;
    }
    const valueToSave = (cell.isMultiLanguage)
      ? {[langtag]: newValue}
      : newValue;

    changeCell({
      cell,
      value: valueToSave
    })
      .then(contentChanged(cell, langtag, oldValue));
    ActionCreator.toggleCellEditing({editing: false});
  }
});

const withTextCellFallback = branch(
  (props) => f.contains("\n", props.value),
  renderComponent(TextCell)
);

const ShortTextCell = (props) => {
  const {cell, handleEditDone, editing, langtag, setCellKeyboardShortcuts, value,focusTable} = props;
  

  return (editing)
    ? (
      <SelectableShortText cell={cell}
                           focusTable={focusTable}
                           langtag={langtag}
                           value={value}
                           onBlur={handleEditDone}
                           setCellKeyboardShortcuts={setCellKeyboardShortcuts}
      />
    )
    : (
      <div className="cell-content">
        {(value === null) ? "" : value}
      </div>
    );
};

ShortTextCell.propTypes = {
  langtag: PropTypes.string.isRequired,
  cell: PropTypes.object.isRequired,
  editing: PropTypes.bool.isRequired,
  selected: PropTypes.bool,
  setCellKeyboardShortcuts: PropTypes.func,
  value: PropTypes.string
};

export default compose(
  pure,
  withTextCellFallback, // just in case someone put a linebreak into the backend
  withEditFn
)(ShortTextCell);
