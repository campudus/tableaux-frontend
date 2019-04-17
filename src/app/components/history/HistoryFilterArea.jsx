import DatePicker from "react-datetime";
import React, { useState } from "react";
import f from "lodash/fp";
import i18n from "i18next";

import PropTypes from "prop-types";
import classNames from "classnames";

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
  const setFilterValue = updateFilter("value");

  const [filterSettingsOpen, setFilterSettingsOpen] = useState(false);
  const toggleFilterSettings = () => {
    setFilterSettingsOpen(!filterSettingsOpen);
  };

  return (
    <div className="history-filter-area">
      {getTableDisplayName(cell.table, langtag)}
      <OverlayHeadRowIdentificator langtag={langtag} cell={cell} />
      <SearchBar
        onChange={setFilterValue}
        value={filter.value}
        icon={<i className="fa fa-search" />}
      />
      <FilterArea
        toggleFilterSettings={toggleFilterSettings}
        filterSettingsOpen={filterSettingsOpen}
        filter={filter}
        updateFilter={updateFilter}
      />
    </div>
  );
};

const FilterArea = ({
  toggleFilterSettings,
  filterSettingsOpen,
  filter,
  updateFilter
}) => {
  const cssClass = classNames("button history-filter__toggle-filters-button", {
    "toggle-filter-button--open": filterSettingsOpen
  });

  const arrowClass = classNames("toggle-filter-button__arrow fa", {
    "fa-wedge-up": filterSettingsOpen,
    "fe-wedge-down": !filterSettingsOpen
  });

  const clearButtonClass = classNames("history-filter__clear-filters-button", {
    "clear-button__active": f.every(x => f.isEmpty(x) || !x, f.values(filter))
  });

  return (
    <div className="history-filter__popup-area">
      <div className="history-popup__header">
        <div className={cssClass} onClick={toggleFilterSettings}>
          <i className="fa fa-filter" />
          <div className="toggle-filter-button__text">
            {i18n.t("common:filter")}
          </div>
          <i className={arrowClass} />
        </div>
      </div>
      <div className={clearButtonClass}>
        <i className="fa fa-clear" />
        <div className="clear-filter-button__text">
          {i18n.t("history:reset-filters")}
        </div>
      </div>
      {filterSettingsOpen ? (
        <FilterPopup
          {...filter}
          filter={filter || {}}
          updateFilter={updateFilter}
        />
      ) : null}
    </div>
  );
};

const FilterPopup = ({
  showAnnotations,
  showComments,
  filter,
  updateFilter
}) => {
  const toggle = key => event => updateFilter(key, event.target.checked);
  return (
    <div className="history-popup__body">
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
      <div className="history-popup__item item--small item__select-from">
        <div className="history-popup-item__header">
          {i18n.t("common:from")}
        </div>
        <DatePicker
          dateFormat={true}
          timeFormat={false}
          onChange={updateFilter("fromDate")}
          value={filter.fromDate}
        />
      </div>
      <div className="history-popup__item item--small item__select-to">
        <div className="history-popup-item__header">{i18n.t("common:to")}</div>
        <DatePicker
          dateFormat={true}
          timeFormat={false}
          onChange={updateFilter("toDate")}
          value={filter.toDate}
        />
      </div>
      <div className="history-popup__item item--small item__select-annotations">
        <div className="history-popup-item__header">
          {i18n.t("common:annotations")}
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
          {i18n.t("common:comments")}
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
