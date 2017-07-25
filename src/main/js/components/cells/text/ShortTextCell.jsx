import React, {PropTypes} from "react";
import ShortTextEditCell from "./ShortTextEditCell";
import ActionCreator from "../../../actions/ActionCreator";
import {isEmpty} from "lodash/fp";
import {changeCell} from "../../../models/Tables";

const ShortTextCell = (props) => {
  const {cell, cell: {isMultiLanguage}, contentChanged, editing, langtag, setCellKeyboardShortcuts} = props;

  const handleEditDone = (newValue) => {
    const oldValue = getValue();
    if ((isEmpty(newValue) && isEmpty(oldValue)) || newValue === oldValue) {
      ActionCreator.toggleCellEditing({editing: false});
      return;
    }
    const valueToSave = (isMultiLanguage)
      ? {[langtag]: newValue}
      : newValue;

    changeCell({cell, value: valueToSave}).then(() => contentChanged(cell, langtag));
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

  if (!editing) {
    return renderTextCell(cell, getValue());
  } else {
    return <ShortTextEditCell cell={cell} langtag={langtag} onBlur={handleEditDone}
                              setCellKeyboardShortcuts={setCellKeyboardShortcuts}/>;
  }
};

ShortTextCell.propTypes = {
  langtag: PropTypes.string.isRequired,
  cell: PropTypes.object.isRequired,
  editing: PropTypes.bool.isRequired,
  contentChanged: PropTypes.func.isRequired,
  setCellKeyboardShortcuts: PropTypes.func
};

export default ShortTextCell;
