import React from "react";
import i18n from "i18next";

import PropTypes from "prop-types";

const FilterPopupFooter = ({ canApplyFilters, applyFilters, clearFilters }) => {
  return (
    <div className="description-row">
      <p className="info">
        <DefaultFooter
          applyFilters={applyFilters}
          clearFilters={clearFilters}
          canApplyFilters={canApplyFilters}
        />
      </p>
    </div>
  );
};

const DefaultFooter = ({ clearFilters, canApplyFilters, applyFilters }) => {
  const handleApplyFilters = React.useCallback(() => {
    if (canApplyFilters) {
      applyFilters();
    } else {
      clearFilters();
    }
  });
  return (
    <>
      <button
        className="filter-popup__clear-filters-button neutral"
        onClick={clearFilters}
      >
        {i18n.t("filter:button.clearFilter")}
      </button>
      <button
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
  canApplyFilters: PropTypes.bool.isRequired,
  filters: PropTypes.arrayOf(PropTypes.object).isRequired,
  sorting: PropTypes.object.isRequired
};