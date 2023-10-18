import i18n from "i18next";
import f from "lodash/fp";
import PropTypes from "prop-types";
import React, { useCallback, useEffect, useRef } from "react";
import { translate } from "react-i18next";
import Select from "react-select";
import KeyboardShortcutsHelper from "../../../helpers/KeyboardShortcutsHelper";
import {
  getFiltersForColumn,
  getSearchFunction
} from "../../../helpers/searchFunctions";
import SvgIcon from "../../helperComponents/SvgIcon";
import { BoolInput } from "./FilterFragments";
import { FilterModes } from "../../../constants/TableauxConstants";
import { maybe } from "../../../helpers/functools";

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
  const columnId = parseInt(filter.columnId);
  const clearValue = () => {
    onChangeValue({});
  };
  const clearColumn = () => {
    handleChangeColumn({});
  };
  const getKeyboardShortcuts = useCallback(
    () => ({
      enter: () => {
        applyFilters();
      },
      escape: () => {
        clearValue();
      }
    }),
    [applyFilters, clearValue]
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
  const handleChangeFilterMode = mode => {
    onChangeMode(mode.value);
  };

  const selectedColumn = searchableColumns.find(
    option => parseInt(option.value) === columnId
  );
  const isFilterColumnSelected =
    !f.isNil(selectedColumn) ||
    (!f.isNil(filter.mode) && filter.columnId === filter.mode);
  const handleChangeColumn = column => {
    onChangeColumn(column);
  };

  useEffect(() => {
    const searchFn = getSearchFunction(filter.mode);
    if (!searchFn?.isValidColumn(selectedColumn ?? {})) {
      maybe(selectedColumn)
        .map(getFiltersForColumn)
        .map(f.first)
        .map(searchFn => ({ value: searchFn.mode }))
        .map(handleChangeFilterMode);
    }
  }, [selectedColumn]);

  const filterModeOptions = selectedColumn
    ? getFiltersForColumn(selectedColumn).map(filterFn => ({
        value: filterFn.mode,
        label: i18n.t(filterFn.displayName)
      }))
    : [];

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
        value={filter?.columnId}
        onChange={handleChangeColumn}
        placeholder={t("filter:input.filter")}
        valueRenderer={valueRenderer}
        noResultsText={t("input.noResult")}
      />
      {filter.columnKind !== BOOL &&
        !f.isNil(filter.columnId) &&
        Number(filter.columnId) >= 0 &&
        filter.mode !== FilterModes.STATUS && (
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

      {filter.columnKind === BOOL || filter.mode === FilterModes.STATUS ? (
        <BoolInput value={filter.value} onChangeValue={onChangeValue} />
      ) : filter.mode === FilterModes.IS_EMPTY ? (
        <div />
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
          {!f.isEmpty(filter?.value) && (
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
