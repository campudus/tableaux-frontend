import i18n from "i18next";
import PropTypes from "prop-types";
import React from "react";
import { useSelector } from "react-redux";

const FilterPopupFooter = ({
  canApplyFilters,
  applyFilters,
  clearFilters,
  langtag
}) => {
  return (
    <div className="description-row">
      <p className="info">
        <DefaultFooter
          langtag={langtag}
          applyFilters={applyFilters}
          clearFilters={clearFilters}
          canApplyFilters={canApplyFilters}
        />
      </p>
    </div>
  );
};

const DefaultFooter = ({
  clearFilters,
  canApplyFilters,
  applyFilters,
  langtag
}) => {
  const tableId = useSelector(state => state.tableView.currentTable);
  const handleApplyFilters = React.useCallback(() => {
    if (canApplyFilters) {
      applyFilters();
    } else {
      clearFilters();
    }
  }, [langtag, tableId, canApplyFilters]);
  return (
    <>
      <button
        className="filter-popup__clear-filters-button neutral"
        onClick={clearFilters}
      >
        {i18n.t("filter:button.clearFilter")}
      </button>
      <button
        disabled={!canApplyFilters}
        className={
          "filter-popup__apply-filters-button " +
          (canApplyFilters ? "" : "neutral")
        }
        onClick={handleApplyFilters}
      >
        {i18n.t("filter:button.doFilter")}
      </button>
    </>
  );
};

export default FilterPopupFooter;

FilterPopupFooter.propTypes = {
  applyFilters: PropTypes.func.isRequired,
  clearFilters: PropTypes.func.isRequired,
  canApplyFilters: PropTypes.bool.isRequired
};
