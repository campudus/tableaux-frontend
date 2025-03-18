import React, { useState, useCallback, useEffect, useRef } from "react";
import i18n from "i18next";

import PropTypes from "prop-types";
import classNames from "classnames";

import { getTableDisplayName } from "../../../helpers/multiLanguage";
import { preventDefault, stopPropagation } from "../../../helpers/functools";
import { outsideClickEffect } from "../../../helpers/useOutsideClick";

const NameEditorInput = ({ onChange, onKeyDown, value }) => (
  <input
    type="text"
    className="input"
    value={value}
    autoFocus
    onKeyDown={onKeyDown}
    onChange={onChange}
  />
);

const NameEditor = ({ table, langtag, changeTableName, locked }) => {
  const container = useRef();
  const [editMode, setEditMode] = useState(false);

  const exitEditMode = useCallback(() => setEditMode(false));
  const enterEditMode = useCallback(event => {
    stopPropagation(event);
    preventDefault(event);
    !locked && setEditMode(true);
  });

  const [value, setValue] = useState(getTableDisplayName(table, langtag) || "");
  const valueRef = useRef(value); // double housekeeping for the unmount lifecycle
  const handleChange = useCallback(event => setValue(event.target.value));
  const clearInput = useCallback(() => setValue(""));

  const saveAndClose = useCallback(event => {
    preventDefault(event);
    stopPropagation(event);
    exitEditMode();
    saveValue(value);
  });

  const saveValue = valueToSave => {
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

  useEffect(
    outsideClickEffect({
      shouldListen: true,
      containerRef: container,
      onOutsideClick: saveAndClose
    }),
    [container.current]
  );

  return (
    <button className={cssClass} onClick={enterEditMode} ref={container}>
      {editMode ? (
        <NameEditorInput
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          value={value}
        />
      ) : (
        i18n.t("table:editor.rename_table")
      )}
    </button>
  );
};

NameEditor.propTypes = {
  table: PropTypes.object.isRequired,
  langtag: PropTypes.string.isRequired
};

export default NameEditor;
