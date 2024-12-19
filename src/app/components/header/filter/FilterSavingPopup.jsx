import i18n from "i18next";
import f from "lodash/fp";
import PropTypes from "prop-types";
import React, { useCallback, useState } from "react";
import listensToClickOutside from "react-onclickoutside";

const FilterSavingPopup = ({ filters, onClose, onSubmit }) => {
  const [title, setTitle] = useState("");
  const handleTitleChange = useCallback(event => setTitle(event.target.value));

  const handleSaveTemplate = useCallback(() => {
    onSubmit(title, filters);
    onClose();
  });

  const handleKeyDown = useCallback(({ key }) => {
    if (key === "Enter" && !f.isEmpty(title)) {
      handleSaveTemplate();
    } else if (key === "Escape") {
      if (f.isEmpty(title)) {
        onClose();
      } else {
        setTitle("");
      }
    }
  });

  return (
    <div
      className="save-template-popup"
      onClick={event => void event.stopPropagation()}
    >
      <header className="save-template-popup__header">
        {i18n.t("table:filter.save-filter")}
      </header>
      <input
        className="save-template__name-input"
        type="text"
        value={title}
        onChange={handleTitleChange}
        placeholder={i18n.t("table:filter.enter-name")}
        autoFocus
        onKeyDown={handleKeyDown}
      />
      <footer className="save-template-popup__footer">
        <button className="button neutral button-cancel" onClick={onClose}>
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

const isApplicable = columns => {
  const hasProperColumns = filters => {
    const filterList = ["and", "or"].includes(filters && filters[0])
      ? filters
      : [filters];
    return filterList?.reduce((hasAll, next) => {
      const [kind, ...args] = next;
      switch (kind) {
        case "value":
          return hasAll && columns.has(args[0]);
        case "and":
        case "or":
          return hasProperColumns(args);
        default:
          return hasAll;
      }
    }, true);
  };
  return hasProperColumns;
};

export const RestoreSavedFiltersArea = ({
  columns,
  onSubmit,
  storedFilters,
  onClear
}) => {
  const columnNames = new Set(columns.map(col => col.name));
  const isValidTemplate = isApplicable(columnNames);
  const isGoodTemplate = t => !f.isEmpty(t) && isValidTemplate(t);
  const getGoodTemplates = f.compose(
    Object.fromEntries,
    f.filter(([_, template]) => isGoodTemplate(template)),
    f.map(([name, view]) => [name, view?.rowsFilter?.filters ?? []]),
    Object.entries
  );
  const templates = getGoodTemplates(storedFilters);
  const clearTemplate = name => void onClear(name);

  return (
    <section className="stored-filters-area">
      <header className="filter-popup__header">
        <span className="filter-popup__heading">Gespeicherte Filter</span>
      </header>
      <ul className="stored-filters">
        {Object.entries(templates).map(([name, template]) => (
          <li className="stored-filter" key={name}>
            <span className="stored-filter__name">{name}</span>
            <button
              className="button button--set-stored-filter"
              onClick={() => onSubmit(template)}
            >
              Anwenden
            </button>
            <button
              className="button button--delete-stored-filter"
              onClick={() => void clearTemplate(name)}
            >
              <i className="fa fa-trash" />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default listensToClickOutside(FilterSavingPopup);
FilterSavingPopup.propTypes = {
  filters: PropTypes.array.isRequired,
  onClose: PropTypes.func.isRequired
};
