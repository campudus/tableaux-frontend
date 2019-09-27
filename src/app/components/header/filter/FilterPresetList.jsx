import { useSelector } from "react-redux";
import React from "react";
import f from "lodash/fp";
import i18n from "i18next";

import {
  FILTER_TEMPLATES_KEY,
  adaptTemplateToTable,
  canApplyTemplateToTable,
  getFilterTemplates
} from "./FilterPresets";
import { useLocalStorage } from "../../../helpers/useLocalStorage";
import FilterPresetListItem from "./FilterPresetListItem";
import actions from "../../../redux/actionCreators";
import store from "../../../redux/store";

const tableColumnsSelector = state => {
  const tableId = state.tableView.currentTable;
  return state.columns[tableId].data;
};

const FilterPresetList = ({ langtag }) => {
  const filterTemplates = getFilterTemplates(langtag);
  const [userFilters, setUserFilters] = useLocalStorage(
    FILTER_TEMPLATES_KEY,
    []
  );

  const [open, setOpen] = React.useState(false);
  const toggleListItems = React.useCallback(() => setOpen(!open));

  const columns = useSelector(tableColumnsSelector);

  const deleteFilterTemplate = template => {
    if (!f.prop("isSystemTemplate", template)) {
      setUserFilters(f.reject(f.propEq("title", template.title), userFilters));
    }
  };

  const applyFilterTemplate = ({ filters, sorting }) =>
    store.dispatch(actions.setFiltersAndSorting(filters, sorting));

  const availableFilters = [
    ...filterTemplates,
    ...(userFilters
      |> f.defaultTo([])
      |> f.filter(canApplyTemplateToTable(columns))
      |> f.map(adaptTemplateToTable(columns)))
  ];

  return (
    <section className="filter-popup__content-section filter-popup__preset-list">
      <button
        className="filter-popup__toggle-list-button"
        onClick={toggleListItems}
      >
        {i18n.t("table:filter.toggle-list")}
      </button>
      <div className="filter-preset-list">
        {open &&
          availableFilters.map(template => (
            <FilterPresetListItem
              key={template.title}
              template={template}
              applyTemplate={applyFilterTemplate}
              deleteTemplate={deleteFilterTemplate}
            />
          ))}
      </div>
    </section>
  );
};

export default FilterPresetList;
