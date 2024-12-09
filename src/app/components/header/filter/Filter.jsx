import classNames from "classnames";
import f from "lodash/fp";
import PropTypes from "prop-types";
import React from "react";
import { translate } from "react-i18next";
import FilterPopup from "./FilterPopup.jsx";

const FilterButton = ({
  langtag,
  columns,
  currentFilter,
  setRowFilter,
  actions,
  t
}) => {
  const [open, setOpen] = React.useState(false);
  const togglePopup = React.useCallback(() => setOpen(!open));
  const closePopup = React.useCallback(() => setOpen(false));

  const buttonCssClass = classNames("filter-popup-button", {
    "ignore-react-onclickoutside": open
  });

  const hasFilter =
    !f.isEmpty(currentFilter) &&
    (!f.isEmpty(currentFilter.filters) || currentFilter.sorting?.colName) &&
    !open;

  const cssClass = classNames("filter-wrapper", {
    active: open,
    "has-filter": hasFilter
  });

  return (
    <div className={cssClass}>
      <button className={buttonCssClass} onClick={togglePopup}>
        <i className="fa fa-filter" />
        {t("button.title")}
      </button>
      {open && (
        <FilterPopup
          langtag={langtag}
          onClickedOutside={closePopup}
          columns={columns}
          currentFilter={currentFilter}
          actions={actions}
          setRowFilter={setRowFilter}
        />
      )}
    </div>
  );
};

export default translate(["filter"])(FilterButton);

FilterButton.propTypes = {
  langtag: PropTypes.string.isRequired,
  columns: PropTypes.array, // required to open popup, but nil if not loaded yet
  table: PropTypes.object.isRequired,
  currentFilter: PropTypes.object,
  setRowFilter: PropTypes.func.isRequired
};
