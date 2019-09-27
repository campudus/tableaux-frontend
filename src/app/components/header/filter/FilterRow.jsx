import { translate } from "react-i18next";
import React, { Component } from "react";
import Select from "react-select";
import f from "lodash/fp";

import PropTypes from "prop-types";

import { BoolInput } from './FilterFragments';
import KeyboardShortcutsHelper from "../../../helpers/KeyboardShortcutsHelper";

export const BOOL = "boolean";
export const TEXT = "text";

@translate(["table", "filter"])
class FilterRow extends Component {
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

  render() {
    const {
      filter,
      onAddFilter,
      onChangeColumn,
      onChangeValue,
      searchableColumns,
      t,
      valueRenderer
    } = this.props;
    const { columnId } = this.props.filter;

    const filterColumnSelected =
      f.isInteger(parseInt(columnId)) ||
      (f.isString(columnId) && !f.isEmpty(columnId));

    return (
      <div className="filter-row">
        <button
          className="filter-array-button"
          onClick={this.clearOrRemoveFilter}
        >
          <i className="fa fa-trash" />
        </button>

        <Select
          className="filter-select"
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
        {filter.columnKind === TEXT ? (
          <Select />
        ) : (
          <div className="placeholder" />
        )}

        {filter.columnKind === BOOL ? (
          <BoolInput
            value={this.props.filter.value}
            onChangeValue={this.props.onChangeValue}
          />
        ) : (
          <span className="filter-mode-wrapper">
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

export default FilterRow;
