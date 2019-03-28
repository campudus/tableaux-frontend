/*
 * Overlay class that allows to edit an editable column's title and description. Saving data is managed by a
 * handler passed from the current table's Columns instance, which created the ColumnEntry which in turn opened
 * the overlay.
 */
import React, { useState } from "react";
import i18n from "i18next";

import PropTypes from "prop-types";

const ColumnEditorOverlay = props => {
  const { handleInput } = props;
  const [columnName, setName] = useState(props.columnName);
  const [description, setDescription] = useState(props.description);

  const setDomElValue = setState => event => {
    setState(event.target.value);
    handleInput({ columnName, description });
  };

  const handleNameChange = setDomElValue(setName);
  const handleDescriptionChange = setDomElValue(setDescription);

  return (
    <div className="content-items">
      <div className="item">
        <div className="item-header">{i18n.t("table:editor.colname")}</div>
        <div className="item-description">
          ({i18n.t("table:editor.sanity_info")})
        </div>
        <input
          type="text"
          autoFocus
          className="item-content"
          onChange={handleNameChange}
          onBlur={handleNameChange}
          value={columnName}
        />
      </div>
      <div className="item">
        <div className="item-header">{i18n.t("table:editor.description")}</div>
        <textarea
          type="text"
          className="item-content"
          rows="6"
          onChange={handleDescriptionChange}
          onBlur={handleDescriptionChange}
          value={description}
        />
      </div>
    </div>
  );
};

ColumnEditorOverlay.propTypes = {
  columnName: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  handleInput: PropTypes.func.isRequired
};

export default ColumnEditorOverlay;
