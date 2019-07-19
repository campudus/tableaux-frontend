import React from "react";
import f from "lodash/fp";
import i18n from "i18next";
import { useSelector } from "react-redux";

import PropTypes from "prop-types";

import { useLocalStorage } from "../../../helpers/useLocalStorage";

const FilterPopupFooter = ({
  filters,
  sorting,
  canApplyFilters,
  applyFilters,
  clearFilters
}) => {
  const [saveMode, setSaveMode] = React.useState(false);
  const enterSaveMode = React.useCallback(() => setSaveMode(true));
  const leaveSaveMode = React.useCallback(() => setSaveMode(false));

  console.log({
    filters,
    sorting,
    canApplyFilters,
    applyFilters,
    clearFilters,
    useSelector
  });
  return (
    <div className="description-row">
      <p className="info">
        {canApplyFilters && saveMode ? (
          <SaveFiltersFooter
            filterSettings={{ filters, sorting }}
            leaveSaveMode={leaveSaveMode}
          />
        ) : (
          <DefaultFooter
            applyFilters={applyFilters}
            clearFilters={clearFilters}
            canApplyFilters={canApplyFilters}
            enterSaveMode={enterSaveMode}
          />
        )}
      </p>
    </div>
  );
};

const DefaultFooter = ({
  clearFilters,
  canApplyFilters,
  applyFilters,
  enterSaveMode
}) => (
  <>
    <span className="text">{i18n.t("filter:help.note")}</span>
    <button
      className={
        "filter-popup__persist-filters-button " +
        (canApplyFilters ? "" : "neutral")
      }
      onClick={enterSaveMode}
      disabled={!canApplyFilters}
    >
      {i18n.t("filter:button.persist-filters")}
    </button>
    <button
      className="filter-popup__clear-filters-button neutral"
      onClick={clearFilters}
      disabled={!canApplyFilters}
    >
      {i18n.t("filter:button.clearFilter")}
    </button>
    <button
      className={
        "filter-popup__apply-filters-button " +
        (canApplyFilters ? "" : "neutral")
      }
      onClick={applyFilters}
      disabled={!canApplyFilters}
    >
      {i18n.t("filter:button.doFilter")}
    </button>
  </>
);

const tableColumnsSelector = state => {
  const tableId = state.tableView.currentTable;
  const columns = state.columns[tableId].data;
  return columns;
};

const SaveFiltersFooter = ({ leaveSaveMode, filterSettings }) => {
  const [presetName, setPresetName] = React.useState("");
  const handleNameChange = React.useCallback(event => {
    const { value } = event.target;
    setPresetName(value);
  });

  const [savedFilters, setSavedFilters] = useLocalStorage("savedFilters", []);
  const filterNames = (savedFilters || []).map(f.prop("title"));

  const filterNameExists = f.contains(presetName, filterNames);

  const handleSaveFilters = React.useCallback(() => {
    const filterTemplate = {
      title: presetName,
      filters: filterSettings.filters,
      sorting: filterSettings.sorting
    };
    const filtersToSave = f.compose(
      f.concat(filterTemplate),
      f.reject(f.propEq("title", presetName))
    )(savedFilters);

    setSavedFilters(filtersToSave);
    leaveSaveMode();
  });

  return (
    <>
      {filterNameExists && (
        <span className="text">{i18n.t("filters:filter-exists")}</span>
      )}
      <button
        className="filter-popup__cancel-persist-button neutral"
        onClick={leaveSaveMode}
      >
        {i18n.t("common:cancel")}
      </button>
      <input
        className="filter-popup__persisted-filter-title"
        type="text"
        value={presetName}
        onChange={handleNameChange}
        placeholder={i18n.t("filters:enter-filter-name")}
      />
      <button
        className="filter-popup__persist-filters-button positiove"
        onClick={handleSaveFilters}
      >
        {i18n.t("filter:button.persist-filter")}
      </button>
    </>
  );
};

export default FilterPopupFooter;

FilterPopupFooter.propTypes = {
  applyFilters: PropTypes.func.isRequired,
  clearFilters: PropTypes.func.isRequired,
  canApplyFilters: PropTypes.bool.isRequired,
  filters: PropTypes.arrayOf(PropTypes.object).isRequired,
  sorting: PropTypes.object.isRequired
};
