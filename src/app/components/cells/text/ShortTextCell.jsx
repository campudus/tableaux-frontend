import React from "react";
import PropTypes from "prop-types";
import f, { isEmpty } from "lodash/fp";
import TextCell from "./TextCell";
// import changeCell from "../../../models/helpers/changeCell";
import SelectableShortText from "./SelectableShortText";
import getDisplayValue from "../../../helpers/getDisplayValue";

const ShortTextCell = props => {
  const {
    handleEditDone,
    column,
    table,
    editing,
    langtag,
    setCellKeyboardShortcuts,
    value,
    focusTable,
    displayValue
  } = props;

  if (f.contains("\n", value)) {
    return <TextCell {...props} />;
  }

  return editing ? (
    <SelectableShortText
      focusTable={focusTable}
      langtag={langtag}
      value={value}
      table={table}
      column={column}
      onBlur={handleEditDone}
      setCellKeyboardShortcuts={setCellKeyboardShortcuts}
    />
  ) : (
    <div className="cell-content">{displayValue[langtag] || ""}</div>
  );
};

class ShortTextCellContainer extends React.PureComponent {
  handleEditDone = newValue => {
    const { value, actions, column, row, table, langtag } = this.props;
    const valueToSave = column.multilanguage
      ? { [langtag]: newValue }
      : newValue;
    actions.changeCellValue({
      tableId: table.id,
      column,
      columnId: column.id,
      rowId: row.id,
      oldValue: value,
      newValue: valueToSave
    });
  };

  render() {
    return (
      <ShortTextCell {...this.props} handleEditDone={this.handleEditDone} />
    );
  }
}

export default ShortTextCellContainer;
