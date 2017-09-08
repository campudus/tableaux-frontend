import React, {} from "react";
import PropTypes from "prop-types";
import ShortTextEditCell from "./ShortTextEditCell";
import ActionCreator from "../../../actions/ActionCreator";
import f, {isEmpty} from "lodash/fp";
import {changeCell} from "../../../models/Tables";
import TextCell from "./TextCell";

const ShortTextCell = (props) => {
  const {cell, cell: {isMultiLanguage}, contentChanged, editing, selected, langtag, setCellKeyboardShortcuts} = props;

  const handleEditDone = (newValue) => {
    const oldValue = getValue();
    if ((isEmpty(newValue) && isEmpty(oldValue)) || newValue === oldValue) {
      ActionCreator.toggleCellEditing({editing: false});
      return;
    }
    const valueToSave = (isMultiLanguage)
      ? {[langtag]: newValue}
      : newValue;

    changeCell({cell, value: valueToSave})
      .then(contentChanged(cell, langtag, oldValue));
    ActionCreator.toggleCellEditing({editing: false});
  };

  const getValue = () => {
    return (isMultiLanguage)
      ? cell.value[langtag]
      : cell.value;
  };

  const renderTextCell = (cell, value) => {
    return (
      <div className="cell-content">
        {(value === null) ? "" : value}
      </div>
    );
  };

  if (f.contains("\n", getValue())) {
    // If someone managed to put multiline text here, fallback to a multiline text cell
    return (
      <TextCell langtag={langtag}
                cell={cell}
                editing={editing}
                selected={selected}
      />
    );
  } else if (!editing) {
    return renderTextCell(cell, getValue());
  } else {
    return (
      <ShortTextEditCell cell={cell} langtag={langtag} onBlur={handleEditDone}
                         setCellKeyboardShortcuts={setCellKeyboardShortcuts}
      />
    );
  }
};

ShortTextCell.propTypes = {
  langtag: PropTypes.string.isRequired,
  cell: PropTypes.object.isRequired,
  editing: PropTypes.bool.isRequired,
  selected: PropTypes.bool,
  setCellKeyboardShortcuts: PropTypes.func
};

export default ShortTextCell;
