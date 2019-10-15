import React, { useState, useCallback, useEffect, useRef } from "react";
import i18n from "i18next";
import listensToClickOutside from "react-onclickoutside";

import PropTypes from "prop-types";
import classNames from "classnames";

import { getTableDisplayName } from "../../../helpers/multiLanguage";
import { preventDefault, stopPropagation } from "../../../helpers/functools";

const NameEditorInput = listensToClickOutside(
  ({ onChange, onKeyDown, value }) => (
    <input
      type="text"
      className="input"
      value={value}
      autoFocus
      onKeyDown={onKeyDown}
      onChange={onChange}
    />
  )
);

const NameEditor = ({ table, langtag, changeTableName, locked }) => {
  const [editMode, setEditMode] = useState(false);

  const exitEditMode = useCallback(() => setEditMode(false));
  const enterEditMode = useCallback(event => {
    stopPropagation(event);
    preventDefault(event);
    console.log("enter edit mode");
    !locked && setEditMode(true);
  });

  const [value, setValue] = useState(getTableDisplayName(table, langtag) || "");
  const valueRef = useRef(value); // double housekeeping for the unmount lifecycle
  const handleChange = useCallback(event => setValue(event.target.value));
  const clearInput = useCallback(() => setValue(""));

  const saveAndClose = useCallback(event => {
    console.log("saveAndClose", value);
    preventDefault(event);
    stopPropagation(event);
    exitEditMode();
    saveValue(value);
  });

  const saveValue = valueToSave => {
    console.log(`saveValue(${valueToSave})`);
    if (valueToSave !== getTableDisplayName(table, langtag)) {
      changeTableName(table.id, { displayName: { [langtag]: valueToSave } });
    }
  };

  const handleKeyDown = useCallback(({ key }) => {
    if (key === "Enter") {
      preventDefault(event);
      return saveAndClose();
    } else if (key === "Escape") {
      return clearInput();
    }
  });

  useEffect(() => () => saveValue(valueRef.current), []);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  const cssClass = classNames("table-rename-wrapper menu-item", {
    "menu-item--disabled": locked,
    active: editMode
  });

  return (
    <button className={cssClass} onClick={enterEditMode}>
      {editMode ? (
        <NameEditorInput
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          value={value}
          handleClickOutside={saveAndClose}
        />
      ) : (
        <span> {i18n.t("table:editor.rename_table")} </span>
      )}
    </button>
  );
};

NameEditor.propTypes = {
  table: PropTypes.object.isRequired,
  langtag: PropTypes.string.isRequired
};

export default NameEditor;
