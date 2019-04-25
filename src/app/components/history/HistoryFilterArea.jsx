import DatePicker from "react-datetime";
import React, { useState } from "react";
import f from "lodash/fp";
import i18n from "i18next";
import moment from "moment";

import PropTypes from "prop-types";
import classNames from "classnames";

import { check, validate } from "../../specs/type";
import { DateFormats } from "../../constants/TableauxConstants";
import { getTableDisplayName } from "../../helpers/multiLanguage";
import OverlayHeadRowIdentificator from "../overlay/OverlayHeadRowIdentificator";
import SearchBar from "../helperComponents/SearchBar";

const HistoryFilterArea = props => {
  const {
    langtag,
    sharedData: { filter = {} },
    updateSharedData,
    cell
  } = props;

  const updateFilter = f.curryN(2, (key, value) =>
    updateSharedData(f.assoc(["filter", key], value))
  );
  const resetFilter = () => updateSharedData(f.assoc("filter", {}));
  const setFilterValue = updateFilter("value");

  const [filterSettingsOpen, setFilterSettingsOpen] = useState(false);
  const toggleFilterSettings = () => {
    setFilterSettingsOpen(!filterSettingsOpen);
  };

  return (
    <div className="history-filter-area">
      <div className="history-filter-area__context">
        {getTableDisplayName(cell.table, langtag)}
      </div>
      <div className="history-filter-area__title">
        <OverlayHeadRowIdentificator langtag={langtag} cell={cell} />
      </div>
      <SearchBar
        onChange={setFilterValue}
        value={filter.value}
        icon={<i className="fa fa-search" />}
        placeholder={i18n.t("history:type-to-filter")}
      />
      <FilterArea
        toggleFilterSettings={toggleFilterSettings}
        filterSettingsOpen={filterSettingsOpen}
        filter={filter}
        updateFilter={updateFilter}
        resetFilter={resetFilter}
      />
    </div>
  );
};

const emptyFilterSpec = {
  value: f.isEmpty,
  author: f.isEmpty,
  showAnnotations: f.complement(f.identity),
  showComments: f.complement(f.identity),
  fromDate: x => f.isEmpty(x) || !moment(x).isValid(),
  toDate: x => f.isEmpty(x) || !moment(x).isValid()
};

const FilterArea = ({
  toggleFilterSettings,
  filterSettingsOpen,
  filter,
  updateFilter,
  resetFilter
}) => {
  const areFiltersSet = !validate(emptyFilterSpec, filter);
  console.log(filter, check(emptyFilterSpec)(filter), areFiltersSet);
  const cssClass = classNames("button history-filter__toggle-filters-button", {
    "toggle-filters-button--open": filterSettingsOpen,
    "toggle-filters-button--has-filters": areFiltersSet
  });

  const arrowClass = classNames("toggle-filter-button__arrow fa", {
    "fa-angle-up": filterSettingsOpen,
    "fa-angle-down": !filterSettingsOpen
  });

  const clearButtonClass = classNames("history-filter__clear-filters-button", {
    "clear-filters-button--has-filters": areFiltersSet
  });

  return (
    <div className="history-filter__popup-area">
      <div className="history-popup__header">
        <div className={cssClass} onClick={toggleFilterSettings}>
          <i className="fa fa-filter" />
          <div className="toggle-filter-button__text">
            {i18n.t("history:toggle-filter-display")}
          </div>
          <i className={arrowClass} />
        </div>
        <div className={clearButtonClass} onClick={resetFilter}>
          <i className="fa fa-minus-circle" />
          <div className="clear-filter-button__text">
            {i18n.t("history:reset-filters")}
          </div>
        </div>
      </div>

      {filterSettingsOpen ? (
        <FilterPopup
          {...filter}
          areFiltersSet={areFiltersSet}
          filter={filter || {}}
          updateFilter={updateFilter}
        />
      ) : null}
    </div>
  );
};

const HistoryDatePicker = props => {
  const { value, handleChange, placeholder } = props;
  const [open, setOpen] = useState(false);
  const toggleOpen = () => setOpen(!open);

  return (
    <div className="history-date-picker">
      <a
        className="history-date-picker__picker-button"
        href=""
        onClick={toggleOpen}
      >
        <i className="fa fa-calendar history-date-picker__button-icon" />
        <div className="history-date-picker__date">
          {value
            ? value.format(DateFormats.formatForUser)
            : i18n.t(placeholder)}
        </div>
        {open && (
          <DatePicker
            open={true}
            onChange={handleChange}
            value={value}
            timeFormat={false}
          />
        )}
      </a>
      <a
        className="history-date-picker__clear-button history-date-picker__button-icon"
        href=""
        onClick={() => handleChange(null)}
      >
        <i className="fa fa-minus-circle history-date-picker__buton-icon" />
      </a>
    </div>
  );
};

const FilterPopup = ({
  showAnnotations,
  showComments,
  filter,
  updateFilter,
  areFiltersSet
}) => {
  const toggle = key => event => updateFilter(key, event.target.checked);
  return (
    <div
      className={
        "history-popup__body" +
        (areFiltersSet ? " popup-body--has-filters" : "")
      }
    >
      <div className="history-popup__item item--large item__select-author">
        <div className="history-popup-item__header">
          {i18n.t("history:filter-author")}
        </div>
        <SearchBar
          onChange={updateFilter("author")}
          value={filter.author}
          placeholder={i18n.t("history:type-or-pick")}
        />
      </div>
      <div className="history-popup__item item--small history-popup-item--datepicker item__select-from">
        <div className="history-popup-item__header">
          {i18n.t("history:from-date")}
        </div>
        <HistoryDatePicker
          handleChange={updateFilter("fromDate")}
          placeholder={"history:row_created"}
          value={filter.fromDate}
        />
      </div>
      <div className="history-popup__item item--small history-popup-item--datepicker item__select-to">
        <div className="history-popup-item__header">
          {i18n.t("history:to-date")}
        </div>
        <HistoryDatePicker
          handleChange={updateFilter("toDate")}
          placeholder={"history:current-status"}
          value={filter.toDate}
        />
      </div>
      <div className="history-popup__item item--small item__select-annotations">
        <div className="history-popup-item__header">
          {i18n.t("history:show-annotations")}
        </div>
        <input
          key={showAnnotations ? "checked" : "unchecked"}
          className="popup-item__checkbox checkbox"
          type="checkbox"
          checked={!!showAnnotations}
          onChange={toggle("showAnnotations")}
        />
      </div>
      <div className="history-popup__item item--small item__select-comments">
        <div className="history-popup-item__header">
          {i18n.t("history:show-comments")}
        </div>
        <input
          key={showComments ? "checked" : "unchecked"}
          className="popup-item__checkbox checkbox"
          type="checkbox"
          checked={!!showComments}
          onChange={toggle("showComments")}
        />
      </div>
    </div>
  );
};

export default HistoryFilterArea;

HistoryFilterArea.propTypes = {
  langtag: PropTypes.string.isRequired,
  cell: PropTypes.object.isRequired
};
