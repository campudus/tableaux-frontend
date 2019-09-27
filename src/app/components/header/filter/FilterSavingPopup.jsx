import React, { useCallback } from "react";
import PropTypes from "prop-types";
import i18n from "i18next";
import listensToClickOutside from "react-onclickoutside";

const FilterSavingPopup = ({
  filters,
  templates,
  saveTemplate,
  columns,
  handleClickOutside
}) => {
  const handleSaveTemplate = useCallback(() => null);
  return (
    <div className="save-template-popup">
      <header className="save-template-popup__header">
        {i18n.t("table:filter.save-filter")}
      </header>
      <input className="save-template__name-input" type="text" value="" />
      <footer className="save-template-popup__footer">
        <button
          className="button neutral button-cancel"
          onClick={handleClickOutside}
        >
          {i18n.t("common:cancel")}
        </button>
        <button className="button button-save" onClick={handleSaveTemplate}>
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
