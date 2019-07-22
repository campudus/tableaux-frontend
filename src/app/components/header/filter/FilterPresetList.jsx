import { useSelector } from "react-redux";
import React from "react";
import f from "lodash/fp";
import listensToClickOutside from "react-onclickoutside";

import classNames from "classnames";

import { getFilterTemplates, FILTER_TEMPLATES_KEY } from "./FilterPresets";
import { useLocalStorage } from "../../../helpers/useLocalStorage";
import { where } from "../../../helpers/functools";
import FilterPresetListItem from "./FilterPresetListItem";
import actions from "../../../redux/actionCreators";
import store from "../../../redux/store";

const tableColumnsSelector = state => {
  const tableId = state.tableView.currentTable;
  return state.columns[tableId].data;
};

const FilterPresets = ({ langtag }) => {
  const [open, setOpen] = React.useState(false);
  const closePopup = React.useCallback(() => setOpen(false));
  const togglePopup = React.useCallback(() => setOpen(!open));

  const ClosingFilterPresetButton = listensToClickOutside(FilterPresetButton);

  return (
    <ClosingFilterPresetButton
      handleClickOutside={closePopup}
      open={open}
      togglePopup={togglePopup}
    >
      {open && <FilterPresetList langtag={langtag} />}
    </ClosingFilterPresetButton>
  );
};

const FilterPresetList = ({ langtag }) => {
  const filterTemplates = getFilterTemplates(langtag);
  const [userFilters, setUserFilters] = useLocalStorage(
    FILTER_TEMPLATES_KEY,
    []
  );

  const columns = useSelector(tableColumnsSelector);

  const deleteFilterTemplate = template => {
    if (!f.prop("isSystemTemplate", template)) {
      setUserFilters(f.reject(f.propEq("title", template.title), userFilters));
    }
  };

  const applyFilterTemplate = ({ filters, sorting }) =>
    store.dispatch(actions.setFiltersAndSorting(filters, sorting));

  const availableInThisTable = ({ columnInfo }) => {
    const suchColumnExists = description => columns.find(where(description));
    return f.all(suchColumnExists, columnInfo);
  };

  const availableFilters = [
    ...filterTemplates,
    ...(userFilters || []).filter(availableInThisTable)
  ];
  return (
    <div className="filter-preset-list">
      {availableFilters.map(template => (
        <FilterPresetListItem
          template={template}
          applyTemplate={applyFilterTemplate}
          deleteTemplate={deleteFilterTemplate}
        />
      ))}
    </div>
  );
};

const FilterPresetButton = listensToClickOutside(
  ({ open, children, togglePopup }) => {
    const className = classNames("filter-popup__button", {
      "filter-popup-button--open": open,
      "ignore-react-onclickoutside": open
    });
    const arrowClass = classNames("filter-popup-button__arrow-icon", "fa", {
      "fa-angle-down": !open,
      "fa-angle-up": open
    });

    return (
      <div className={className} onClick={togglePopup}>
        <a className="filter-popup-button__inner-button" href="#">
          <i className={arrowClass} />
        </a>
        {children}
      </div>
    );
  }
);

export default FilterPresets;
