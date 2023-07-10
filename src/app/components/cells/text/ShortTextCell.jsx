import React, { useCallback, useEffect, useState } from "react";
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
    focusTable
  } = props;

  const isMultiLang = column.multilanguage;

  if (f.contains("\n", value)) {
    return <TextCell {...props} />;
  }

  const originalValue = isMultiLang ? value[langtag] : value;

  const [editorValue, setEditorValue] = useState(originalValue || "");
  const saveEdits = () => handleEditDone(editorValue?.trim());
  const handleFinish = (shouldSave = true, finalValue = undefined) => {
    if (shouldSave) {
      handleEditDone(finalValue || editorValue);
    } else {
      setEditorValue(originalValue);
    }
    actions.toggleCellEditing({ editing: false });
    focusTable();
  };

  useEffect(() => {
    const setNewValue = !originalValue && Boolean(editorValue);
    const changedExistingValue =
      editorValue !== originalValue && Boolean(originalValue);
    if (!editing && (setNewValue || changedExistingValue)) {
      saveEdits();
    }
  }, [editing]);

  return editing ? (
    <SelectableShortText
      focusTable={focusTable}
      langtag={langtag}
      value={editorValue}
      table={table}
      column={column}
      onChange={setEditorValue}
      onFinish={handleFinish}
      setCellKeyboardShortcuts={setCellKeyboardShortcuts}
      actions={actions}
    />
  ) : (
    <div className="cell-content">{editorValue}</div>
  );
};

const ShortTextCellContainer = props => {
  const { value, actions, column, row, table, langtag } = props;
  const handleEditDone = useCallback(
    newValue => {
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
    },
    [value, column.id, row.id, table.id, langtag]
  );

  return <ShortTextCell {...props} handleEditDone={handleEditDone} />;
};

export default ShortTextCellContainer;
