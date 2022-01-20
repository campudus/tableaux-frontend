import React from "react";
import f from "lodash/fp";
import TextCell from "./TextCell";
import SelectableShortText from "./SelectableShortText";

const ShortTextCell = props => {
  const {
    actions,
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
      actions={actions}
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
