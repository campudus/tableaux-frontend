// @flow

import { withTranslation } from "react-i18next";
import React, { PureComponent, useCallback } from "react";
import f from "lodash/fp";
import i18n from "i18next";

import PropTypes from "prop-types";

import { BoolInput } from "./FilterFragments";
import { type Filter, FilterTypes, type FilterValue } from "./filter.flowtypes";
import GrudSelect from "../../helperComponents/GrudSelect";
import KeyboardShortcutsHelper from "../../../helpers/KeyboardShortcutsHelper";
import SearchFunctions from "../../../helpers/searchFunctions";
import SvgIcon from "../../helperComponents/SvgIcon";

export const BOOL = "boolean";
export const TEXT = "text";

@withTranslation(["table", "filter"])
class FilterRow extends PureComponent {
  static propTypes = {
    searchableColumns: PropTypes.array.isRequired,
    valueRenderer: PropTypes.func.isRequired,
    onChangeColumn: PropTypes.func.isRequired,
    onChangeValue: PropTypes.func.isRequired,
    onChangeMode: PropTypes.func.isRequired,
    filter: PropTypes.object.isRequired,
    onAddFilter: PropTypes.func,
    onRemoveFilter: PropTypes.func,
    applyFilters: PropTypes.func.isRequired
  };

  constructor(props) {
    super(props);
    this.state = {};
  }

  getKeyboardShortcuts = () => {
    const { applyFilters } = this.props;
    return {
      enter: () => {
        applyFilters();
      },
      escape: () => {
        const { onChangeValue } = this.props;
        onChangeValue && onChangeValue({});
      }
    };
  };

  setFilterInputRef = node => {
    this.filterInput = node;
  };

  focusFilterInput = () => {
    this.filterInput && this.filterInput.focus();
  };

  clearFilter = () => {
    const { onChangeValue, onChangeColumn } = this.props;
    onChangeValue && onChangeValue({});
    onChangeColumn && onChangeColumn({});
  };

  clearOrRemoveFilter = () => {
    const { onRemoveFilter } = this.props;
    onRemoveFilter ? onRemoveFilter() : this.clearFilter();
  };

  handleFilterModeChange = mode => {
    this.props.onChangeMode(mode.value);
  };

  render() {
    const {
      filter,
      onAddFilter,
      onChangeColumn,
      onChangeValue,
      searchableColumns,
      t
    } = this.props;
    const { columnId } = this.props.filter;

    const filterColumnSelected =
      f.isInteger(parseInt(columnId)) ||
      (f.isString(columnId) && !f.isEmpty(columnId));

    const filterModeOptions =
      SearchFunctions
      |> f.keys
      |> f.map(key => ({
        value: key,
        label: i18n.t(SearchFunctions[key].displayName)
      }));

    const selectedMode = filterModeOptions.find(f.propEq("value"), filter.mode);

    const toOption = ({ label, value, kind, isDisabled }) => ({
      label,
      isDisabled,
      value: { value, kind }
    });

    return (
      <div className="filter-row">
        <button
          className="filter-array-button col-one"
          onClick={this.clearOrRemoveFilter}
        >
          <i className="fa fa-trash" />
        </button>

        <GrudSelect
          className="filter-select-wrapper col-two"
          classNamePrefix="filter-select"
          options={searchableColumns.map(toOption)}
          searchable={true}
          value={filter}
          onChange={onChangeColumn}
          placeholder={t("filter:input.filter")}
          mkOption={f.identity}
          noResultsText={t("input.noResult")}
        />
        {filter.columnKind !== BOOL &&
          !f.isNil(filter.columnId) &&
          Number(filter.columnId) >= 0 && (
            <GrudSelect // Filter mode selector
              className="filter-select-wrapper filter-row__mode-select col-three"
              classPrefix="filter-select"
              openOnFocus
              value={selectedMode}
              options={filterModeOptions}
              onChange={this.handleFilterModeChange}
              mkOption={f.identity}
            />
          )}

        {filter.columnKind === BOOL ? (
          <BoolInput
            value={this.props.filter.value}
            onChangeValue={this.props.onChangeValue}
          />
        ) : (
          <span className="filter-mode-wrapper col-four">
            <input
              value={f.isString(filter.value) ? filter.value : ""}
              type="text"
              className="filter-input"
              disabled={!filterColumnSelected}
              ref={this.setFilterInputRef}
              onChange={onChangeValue}
              onKeyDown={KeyboardShortcutsHelper.onKeyboardShortcut(
                this.getKeyboardShortcuts
              )}
              onClick={this.focusFilterInput}
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
  }
}

type ColumnSelectProps = {
  filter: Filter,
  options: Array<Filter>,
  onChange: any
};
const ColumnSelect = ({ filter, options, onChange }: ColumnSelectProps) => (
  <GrudSelect
    options={options}
    placeholder={i18n.t("filter:input.filter")}
    onChange={onChange}
    value={filter}
  />
);

type ModeSelectProps = {
  filter: Filter,
  onChange: any
};
const ModeSelect = ({ filter, onChange }: ModeSelectProps) => null;

type FilterInputProps = {
  filter: Filter,
  onChange: FilterValue => void
};
const FilterInput = (props: FilterInputProps) => {
  const InputForFilter = f.cond([
    [f.propEq(["kind"], FilterTypes.BOOL), () => BoolInput],
    [f.propEq(["kind"], FilterTypes.TEXT), () => TextInput],
    [f.stubTrue, () => NoInput]
  ])(props.filter);

  return <InputForFilter {...props} />;
};

const NoInput = () => null;

const TextInput = ({ filter, onChange }: FilterInputProps) => {
  const handleChange = useCallback(event => onChange(event.target.value));
  const filterColumnSelected = !f.isNil(filter.columnId);

  return (
    <span className="filter-mode-wrapper col-four">
      <input
        type="text"
        value={filter.value || ""}
        onChange={handleChange}
        disabled={!filterColumnSelected}
      />
      {filterColumnSelected && (
        <button className="filter-input__clear-button col-five">
          <SvgIcon icon="cross" />
        </button>
      )}
    </span>
  );
};

export const FilterRow2 = props => {
  const {
    columnOptions,
    filter,
    onChangeFilterValue,
    onChangeColumn,
    onChangeFilterMode,
    onCreateFilter,
    onDeleteFilter,
    idx
  } = props;
  console.log("FilterRow2 props", props);

  const clearFilter = () => {
    onChangeColumn(idx, null);
  };

  const clearOrRemoveFilter = useCallback(() => {
    if (onDeleteFilter) {
      onDeleteFilter(idx);
    } else {
      clearFilter();
    }
  });

  return (
    <div className="filter-row">
      <button
        className="filter-array-button col-one"
        onClick={clearOrRemoveFilter}
      >
        <i className="fa fa-trash" />
      </button>

      <ColumnSelect
        options={columnOptions}
        onChange={onChangeColumn}
        filter={filter}
      />
      <ModeSelect filter={filter} onChange={onChangeFilterMode} />
      <FilterInput onChange={onChangeFilterValue} filter={filter} />

      {onCreateFilter && (
        <button
          className="filter-array-button col-five"
          onClick={onCreateFilter}
        >
          <i className="fa fa-plus" />
        </button>
      )}
    </div>
  );
};

export default FilterRow2;
