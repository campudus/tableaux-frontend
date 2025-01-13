import React from "react";
import * as f from "lodash/fp";
import i18n from "i18next";
import listensToClickOutside from "react-onclickoutside";

import PropTypes from "prop-types";
import classNames from "classnames";

import { FilterModes } from "../../../constants/TableauxConstants";
import {
  either,
  preventDefault,
  stopPropagation,
  when
} from "../../../helpers/functools";
import SearchFunctions, {
  SEARCH_FUNCTION_IDS
} from "../../../helpers/searchFunctions";

const SearchModePopup = ({
  closePopup,
  popupOpen,
  filterMode,
  setFilterMode
}) => {
  const activeIdx = f.compose(
    when(f.gt(0), () => 0),
    f.findIndex(f.eq(filterMode))
  )(SEARCH_FUNCTION_IDS);

  const updateFilter = React.useCallback(mode => () => {
    setFilterMode(mode);
    closePopup();
  });

  return (
    popupOpen && (
      <div className="filter-option-popup">
        {SEARCH_FUNCTION_IDS.map((id, idx) => {
          const name = i18n.t(SearchFunctions[id].displayName);
          const itemClass = classNames("menu-item", {
            active: idx === activeIdx
          });
          return (
            <div className={itemClass} key={id}>
              <button className="menu-item-inner" onClick={updateFilter(id)}>
                {name}
              </button>
            </div>
          );
        })}
      </div>
    )
  );
};

const SearchBar = ({
  filterMode,
  filterValue,
  setFilterMode,
  setFilterValue,
  onKeyStroke,
  updateSharedData
}) => {
  const [popupOpen, setPopupOpen] = React.useState(false);
  const inputRef = React.useRef();
  const closePopup = React.useCallback(() => setPopupOpen(false));
  const togglePopup = () => {
    setPopupOpen(!popupOpen);
  };
  const focusInput = React.useCallback(() => {
    requestAnimationFrame(() => void inputRef.current?.focus());
  }, [inputRef.current]);
  const handleChange = event => void setFilterValue(event.target.value);
  React.useEffect(() => {
    updateSharedData(f.assoc("focusInput", focusInput));
  }, [focusInput]);
  React.useEffect(() => void focusInput(), [filterValue, focusInput]);

  const handleInputKeys = React.useCallback(
    event => {
      const clearOrClose = () => {
        if (!f.isEmpty(filterValue)) {
          setFilterValue("");
          preventDefault(event);
          stopPropagation(event);
        }
      };
      const passOnKey = event => {
        preventDefault(event);
        stopPropagation(event);
        onKeyStroke && onKeyStroke(event);
      };

      const isIn = x => y => f.contains(f.toLower(y), f.map(f.toLower, x));

      f.cond([
        [f.eq("Escape"), () => clearOrClose],
        [isIn(["arrowup", "arrowdown", "tab", "enter"]), () => passOnKey],
        [f.stubTrue, () => f.noop]
      ])(event.key)(event);
    },
    [setFilterValue, focusInput, onKeyStroke]
  );

  const filterName = either(SearchFunctions[filterMode || FilterModes.CONTAINS])
    .map(f.prop("displayName"))
    .map(x => i18n.t(x))
    .getOrElse("unknown search value: " + filterMode);

  const FilterPopup = listensToClickOutside(SearchModePopup);

  return (
    <div className="filter-bar">
      <input
        className="header-input"
        type="text"
        value={filterValue || ""}
        autoFocus
        ref={inputRef}
        placeholder={filterName}
        onInput={handleInputKeys}
        onChange={handleChange}
      />
      <button className="popup-button" onClick={togglePopup}>
        <i className="fa fa-search" />
        <i className="fa fa-angle-down" />
      </button>
      <FilterPopup
        closePopup={closePopup}
        popupOpen={popupOpen}
        handleClickOutside={closePopup}
        filterMode={filterMode}
        setFilterMode={setFilterMode}
      />
    </div>
  );
};

SearchBar.propTypes = {
  id: PropTypes.number.isRequired,
  filterMode: PropTypes.string,
  filterValue: PropTypes.string,
  setFilterMode: PropTypes.func,
  setFilterValue: PropTypes.func,
  onKeyStroke: PropTypes.func,
  updateSharedData: PropTypes.func.isRequired
};

export default SearchBar;
