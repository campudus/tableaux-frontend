import React from "react";
import f from "lodash/fp";
import listensToClickOutside from "react-onclickoutside";

import classNames from "classnames";

import { getFilterTemplates, FILTER_TEMPLATES_KEY } from "./FilterPresets";
import { useLocalStorage } from "../../../helpers/useLocalStorage";
import FilterPresetListItem from "./FilterPresetListItem";

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

  const deleteFilterTemplate = template => {
    if (!f.prop("isSystemTemplate", template)) {
      setUserFilters(f.reject(f.propEq("title", template.title), userFilters));
    }
  };

  const applyFilterTemplate = () => null;

  const availableFilters = [...filterTemplates, ...(userFilters || [])];
  console.log({ availableFilters });
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
