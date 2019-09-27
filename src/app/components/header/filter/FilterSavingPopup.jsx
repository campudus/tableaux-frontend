import { useSelector } from "react-redux";
import React, { useCallback, useState } from "react";
import f from "lodash/fp";
import i18n from "i18next";
import listensToClickOutside from "react-onclickoutside";

import PropTypes from "prop-types";

import { FILTER_TEMPLATES_KEY, filterListToTemplate } from "./FilterPresets";
import { useLocalStorage } from "../../../helpers/useLocalStorage";

const tableColumnsSelector = state => {
  const tableId = state.tableView.currentTable;
  return state.columns[tableId].data;
};

const FilterSavingPopup = ({ filters, handleClickOutside }) => {
  const columns = useSelector(tableColumnsSelector);
  const [title, setTitle] = useState("");
  const [userTemplates, setUserTemplates] = useLocalStorage(
    FILTER_TEMPLATES_KEY,
    []
  );

  const handleTitleChange = useCallback(event => setTitle(event.target.value));
  const handleSaveTemplate = useCallback(() => {
    const template = filterListToTemplate(title, filters, columns);
    const templatesToStore =
      userTemplates |> f.reject(f.propEq("title", title)) |> f.concat(template);
    setUserTemplates(templatesToStore);
    handleClickOutside();
  });

  return (
    <div className="save-template-popup">
      <header className="save-template-popup__header">
        {i18n.t("table:filter.save-filter")}
      </header>
      <input
        className="save-template__name-input"
        type="text"
        value={title}
        onChange={handleTitleChange}
        placeholder={i18n.t("table:filter.enter-name")}
      />
      <footer className="save-template-popup__footer">
        <button
          className="button neutral button-cancel"
          onClick={handleClickOutside}
        >
          {i18n.t("common:cancel")}
        </button>
        <button
          className="button button-save"
          disabled={f.isEmpty(title)}
          onClick={handleSaveTemplate}
        >
          {i18n.t("table:filter.save-filter")}
        </button>
      </footer>
    </div>
  );
};

export default listensToClickOutside(FilterSavingPopup);
FilterSavingPopup.propTypes = {
  filters: PropTypes.array.isRequired,
  templates: PropTypes.array.isRequired,
  saveTemplate: PropTypes.func.isRequired,
  columns: PropTypes.array.isRequired
};
