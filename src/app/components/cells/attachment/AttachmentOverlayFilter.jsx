import React from "react";
import PropTypes from "prop-types";
import f from "lodash/fp";
import { compose, pure, withHandlers } from "recompose";
import i18n from "i18next";
import { Popup } from "../../helperComponents/commonPatterns";
import { FilterModes } from "../../../constants/TableauxConstants";

const AttachmentOverlayFilter = withHandlers({
  setFilterValue: ({ setFilter }) => event =>
    setFilter({
      value: f.getOr("", ["target", "value"], event)
    }),
  setFilterMode: ({ setFilter }) => mode =>
    setFilter({
      mode
    }),
  toggleSortOrder: ({ setFilter, sortOrder }) => () =>
    setFilter({
      sorting: (sortOrder + 1) % 2
    }),
  clearFilter: ({ setFilter }) => () =>
    setFilter({
      value: ""
    })
})(props => (
  <div className="attachment-overlay-filter-container">
    <AOFilterBar
      {...f.pick(
        [
          "filterMode",
          "setFilterMode",
          "filterValue",
          "setFilterValue",
          "clearFilter"
        ],
        props
      )}
    />
    <AOSortButton {...f.pick(["sortOrder", "toggleSortOrder"], props)} />
  </div>
));

const AOFilterBar = compose(
  pure,
  withHandlers({
    keyDownHandler: ({ filterValue, clearFilter }) => event => {
      if (f.toLower(event.key) === "escape" && !f.isEmpty(filterValue)) {
        event.preventDefault();
        event.stopPropagation();
        clearFilter();
      }
    }
  })
)(props => {
  const placeholder =
    props.filterMode === FilterModes.CONTAINS
      ? "table:filter.contains"
      : "table:filter.starts_with";
  return (
    <div className="attachment-overlay-filter-bar">
      <input
        type="text"
        className="attachment-overlay-filter-input"
        placeholder={i18n.t(placeholder)}
        value={f.getOr("", "filterValue", props)}
        onChange={props.setFilterValue}
        onKeyDown={props.keyDownHandler}
      />
      <AOFilterBarModeSwitcher
        filterMode={props.filterMode}
        setFilterMode={props.setFilterMode}
      />
    </div>
  );
});

const AOFilterBarModeSwitcher = pure(props => (
  <div className="popup-wrapper">
    <Popup
      container={AOFilterBarModePopupButton}
      containerClass="popup-button"
      popup={AOFilterBarModePopup}
      filterMode={props.filterMode}
      setFilterMode={props.setFilterMode}
    />
  </div>
));

const AOFilterBarModePopupButton = pure(() => (
  <i>
    <i className="fa fa-search" />
    <i className="fa fa-angle-down" />
  </i>
));

const AOFilterBarModePopup = pure(({ filterMode, setFilterMode }) => (
  <div className="attachment-overlay-filter-mode-popup">
    <AOFilterModeItem
      setFilterMode={setFilterMode}
      filterMode={filterMode}
      itemMode={FilterModes.CONTAINS}
      label={"table:filter.contains"}
    />
    <AOFilterModeItem
      setFilterMode={setFilterMode}
      filterMode={filterMode}
      itemMode={FilterModes.STARTS_WITH}
      label={"table:filter.starts_with"}
    />
  </div>
));

const AOFilterModeItem = ({ setFilterMode, filterMode, itemMode, label }) => (
  <button
    draggable={false}
    onClick={() => setFilterMode(itemMode)}
    className={
      filterMode === itemMode ? "filter-mode-item selected" : "filter-mode-item"
    }
  >
    {i18n.t(label)}
  </button>
);

const AOSortButton = props => {
  const { sortOrder, toggleSortOrder } = props;
  return (
    <button
      className="attachment-overlay-sort-button"
      draggable={false}
      onClick={toggleSortOrder}
    >
      {sortOrder === 0 ? (
        <i className="fa fa-sort-alpha-asc" />
      ) : (
        <i>
          <i className="fa fa-long-arrow-down" />
          <i className="fa fa-clock-o" />
        </i>
      )}
    </button>
  );
};

export default pure(AttachmentOverlayFilter);

AttachmentOverlayFilter.propTypes = {
  setFilter: PropTypes.func.isRequired,
  filterMode: PropTypes.string,
  filterValue: PropTypes.string,
  sortOrder: PropTypes.number
};
