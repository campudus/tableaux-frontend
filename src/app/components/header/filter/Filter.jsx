import classNames from "classnames";
import f from "lodash/fp";
import PropTypes from "prop-types";
import React from "react";
import { translate } from "react-i18next";
import CustomEvent from "../../../helpers/CustomEvent.js";
import FilterPopup from "./FilterPopup.jsx";

export const OpenFilterEvent = "event/open-row-filter-popup";

const FilterButton = ({
  langtag,
  columns,
  currentFilter,
  setRowFilter,
  actions,
  t
}) => {
  const [open, setOpen] = React.useState(false);
  const [initialFilter, setInitialFilter] = React.useState(currentFilter);
  const closePopup = React.useCallback(() => setOpen(false), []);
  const openPopup = React.useCallback(filters => {
    setInitialFilter(filters);
    setOpen(true);
  }, []);

  const togglePopup = React.useCallback(
    () => (open ? closePopup() : openPopup(currentFilter)),
    [currentFilter, open]
  );

  CustomEvent.useCustomEvent(OpenFilterEvent, openPopup, document.body);

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
          currentFilter={initialFilter}
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
