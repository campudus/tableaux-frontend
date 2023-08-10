import { translate } from "react-i18next";
import React, { useCallback, useRef } from "react";
import Select from "react-select";
import f from "lodash/fp";
import i18n from "i18next";

import PropTypes from "prop-types";

import { BoolInput } from "./FilterFragments";
import KeyboardShortcutsHelper from "../../../helpers/KeyboardShortcutsHelper";
import SearchFunctions from "../../../helpers/searchFunctions";
import SvgIcon from "../../helperComponents/SvgIcon";

export const BOOL = "boolean";
export const TEXT = "text";

const FilterRow = ({
  applyFilters,
  filter,
  onAddFilter,
  onChangeColumn,
  onChangeMode,
  onChangeValue,
  onRemoveFilter,
  searchableColumns,
  valueRenderer,
  t
}) => {
  const { columnId } = filter;
  const clearValue = () => {
    if (onChangeValue) onChangeValue({});
  };
  const clearColumn = () => {
    if (onChangeColumn) onChangeColumn();
  };
  const getKeyboardShortcuts = useCallback(
    () => (
      {
        enter: () => {
          applyFilters();
        },
        escape: () => {
          clearValue();
        }
      },
      [applyFilters, clearValue]
    )
  );

  const filterInputRef = useRef(null);
  const focusFilterInput = () => {
    filterInputRef.current?.focus();
  };
  const clearFilter = () => {
    clearValue();
    clearColumn();
  };
  const clearOrRemoveFilter = () => {
    if (onRemoveFilter) onRemoveFilter();
    else clearFilter();
  };
  const handleChangeFilterMode = mode => onChangeMode(mode.value);

  const isFilterColumnSelected =
    f.isInteger(parseInt(columnId)) ||
    (f.isString(columnId) && !f.isEmpty(columnId));
  const filterModeOptions =
    SearchFunctions
    |> f.keys
    |> f.map(key => ({
      value: key,
      label: i18n.t(SearchFunctions[key].displayName)
    }));

  return (
    <div className="filter-row">
      <button
        className="filter-array-button col-one"
        onClick={clearOrRemoveFilter}
      >
        <i className="fa fa-trash" />
      </button>

      <Select
        className="filter-select col-two"
        options={searchableColumns}
        searchable={true}
        clearable={false}
        openOnFocus
        value={columnId}
        onChange={onChangeColumn}
        placeholder={t("filter:input.filter")}
        valueRenderer={valueRenderer}
        noResultsText={t("input.noResult")}
      />
      {filter.columnKind !== BOOL &&
        !f.isNil(filter.columnId) &&
        Number(filter.columnId) >= 0 &&
        filter.mode !== "STATUS" && (
          <Select
            className="filter-row__mode-select col-three"
            searchable={false}
            clearable={false}
            openOnFocus
            value={filter.mode}
            options={filterModeOptions}
            onChange={handleChangeFilterMode}
          />
        )}

      {filter.columnKind === BOOL || filter.mode === "STATUS" ? (
        <BoolInput value={filter.value} onChangeValue={onChangeValue} />
      ) : (
        <span className="filter-mode-wrapper col-four">
          <input
            value={f.isString(filter.value) ? filter.value : ""}
            type="text"
            className="filter-input"
            disabled={!isFilterColumnSelected}
            ref={filterInputRef}
            onChange={onChangeValue}
            onKeyDown={KeyboardShortcutsHelper.onKeyboardShortcut(
              getKeyboardShortcuts
            )}
            onClick={focusFilterInput}
          />
          {!f.isNil(columnId) && (
            <button
              onClick={() => onChangeValue({ target: { value: "" } })}
              className="filter-input__clear-button col-five"
            >
              <SvgIcon icon="cross" />
            </button>
          )}
        </span>
      )}

      {onAddFilter && (
        <button className="filter-array-button" onClick={onAddFilter}>
          <i className="fa fa-plus" />
        </button>
      )}
    </div>
  );
};

FilterRow.propTypes = {
  applyFilters: PropTypes.func.isRequired,
  filter: PropTypes.object.isRequired,
  onAddFilter: PropTypes.func,
  onChangeColumn: PropTypes.func.isRequired,
  onChangeMode: PropTypes.func.isRequired,
  onChangeValue: PropTypes.func.isRequired,
  onRemoveFilter: PropTypes.func,
  searchableColumns: PropTypes.array.isRequired,
  valueRenderer: PropTypes.func.isRequired
};

export default translate(["table", "filter"])(FilterRow);
