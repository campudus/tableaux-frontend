import React from "react";
import * as _ from "lodash";
import * as f from "lodash/fp";
import ActionCreator from "../../../actions/ActionCreator";
import listensToClickOutside from "react-onclickoutside";
import KeyboardShortcutsHelper from "../../../helpers/KeyboardShortcutsHelper";
import Select from "react-select";
import FilterModePopup from "./FilterModePopup";
import {translate} from "react-i18next";
import TableauxConstants, {FilterModes, ColumnKinds} from "../../../constants/TableauxConstants";
import i18n from "i18next";
import {either} from "../../../helpers/monads";
import SearchFunctions from "../../../helpers/searchFunctions";

@translate(["filter", "table"])
@listensToClickOutside
class FilterPopup extends React.Component {

  static propTypes = {
    langtag: React.PropTypes.string.isRequired,
    onClickedOutside: React.PropTypes.func.isRequired,
    columns: React.PropTypes.object,
    currentFilter: React.PropTypes.object
  };

  static isSortableColumn = (column) => {
    return column.kind === ColumnKinds.text
      || column.kind === ColumnKinds.shorttext
      || column.kind === ColumnKinds.richtext
      || column.kind === ColumnKinds.numeric
      || column.kind === ColumnKinds.concat
      || column.kind === ColumnKinds.link
      || column.kind === ColumnKinds.boolean
      || column.kind === ColumnKinds.date
      || column.kind === ColumnKinds.datetime;
  };

  static isSearchableColumn = (column) => {
    return column.kind === ColumnKinds.text
      || column.kind === ColumnKinds.shorttext
      || column.kind === ColumnKinds.richtext
      || column.kind === ColumnKinds.numeric
      || column.kind === ColumnKinds.concat
      || column.kind === ColumnKinds.link;
  };

  sortableColumns = null;
  searchableColumns = null;

  constructor(props) {
    super(props);

    let currFilter = props.currentFilter;

    this.state = {
      selectedFilterColumn: currFilter && _.isFinite(currFilter.filterColumnId) ? currFilter.filterColumnId : null,
      selectedSortColumn: currFilter && _.isFinite(currFilter.sortColumnId) ? currFilter.sortColumnId : null,
      filterValue: currFilter && !_.isEmpty(currFilter.filterValue) ? currFilter.filterValue : "",
      sortValue: currFilter && !_.isEmpty(currFilter.sortValue)
        ? currFilter.sortValue
        : TableauxConstants.SortValues.ASC,
      filterModesOpen: false
    };

    this.sortableColumns = this.buildColumnOptions(FilterPopup.isSortableColumn);
    this.searchableColumns = this.buildColumnOptions(FilterPopup.isSearchableColumn);
  }

  getSortableColumns() {
    return this.sortableColumns || (this.sortableColumns = this.buildColumnOptions(FilterPopup.isSortableColumn()));
  }

  getSearchableColumns() {
    const searchableColumns = this.searchableColumns || (this.searchableColumns = this.buildColumnOptions(FilterPopup.isSearchableColumn()));
    return [
      {
        label: i18n.t("table:filters.needs_translation"),
        value: "none",
        kind: ColumnKinds.boolean
      }, ...searchableColumns
    ];
  }

  buildColumnOptions(filterFn) {
    const {t, columns, langtag} = this.props;

    return _.map(_.filter(columns.models, filterFn), (column) => {
      // Show display name with fallback to machine name
      const columnDisplayName = column.displayName[langtag] || column.name;
      // ID Column gets translated name
      const labelName = column.id === 0 ? t("concat_column_name") : columnDisplayName;

      return {
        label: labelName,
        value: column.id,
        kind: column.kind
      };
    });
  }

  getSortOptions() {
    const {t} = this.props;

    return [
      {
        label: t("help.sortasc"),
        value: TableauxConstants.SortValues.ASC
      },
      {
        label: t("help.sortdesc"),
        value: TableauxConstants.SortValues.DESC
      }
    ];
  }

  filterInputChange = (event) => {
    this.setState({filterValue: event.target.value});
  };

  filterUpdate = (event) => {
    const {selectedFilterColumn, selectedSortColumn} = this.state;
    const filterMode = either(this.props.currentFilter)
      .map(f.prop("filterMode"))
      .getOrElse(FilterModes.CONTAINS);
    ActionCreator.changeFilter(selectedFilterColumn,
      this.state.filterValue,
      filterMode,
      selectedSortColumn,
      this.state.sortValue);
    this.handleClickOutside(event);
  };

  clearFilter = (event) => {
    ActionCreator.clearFilter();
    this.handleClickOutside(event);
  };

  handleClickOutside = (event) => {
    this.props.onClickedOutside(event);
  };

  selectFilterValueRenderer = (option) => {
    return <div><span>{option.label}</span></div>;
  };

  selectSortValueRenderer = (option) => {
    if (option.value === TableauxConstants.SortValues.ASC) {
      return <div><i className="fa fa-sort-alpha-asc" /> {option.label}</div>;
    } else {
      return <div><i className="fa fa-sort-alpha-desc" /> {option.label}</div>;
    }
  };

  filtersForKind = kind => {
    console.log("Select proper kind for", kind)
    const isIn = els => el => f.contains(el, els);
    return f.cond([
      [f.eq(ColumnKinds.boolean), f.always("boolean")],
      [f.eq(ColumnKinds.number), f.always("text")],
      [f.stubTrue, f.always("text")]
    ])(kind);
  };

  onChangeSelectFilter = (option) => {
    const {value, kind} = option;
    if (f.isString(value) || f.kind === "boolean") {
      this.props.setFilterMode(FilterModes.UNTRANSLATED);
      this.setState({
        selectedFilterColumn: value,
        selectedColumnKind: ColumnKinds.boolean,
        filterValue: true
      })
    } else {
      this.setState({
        selectedFilterMode: this.state.selectedFilterMode || FilterModes.CONTAINS,
        selectedFilterColumn: value,
        selectedColumnKind: this.filtersForKind(kind)
      });
    }
  };

  onChangeSelectSortColumn = (selection) => {
    this.setState({selectedSortColumn: selection.value});
  };

  onChangeSelectSortValue = (selection) => {
    this.setState({sortValue: selection.value});
  };

  getKeyboardShortcuts = (event) => {
    return {
      enter: (event) => {
        this.filterUpdate(event);
      },
      escape: event => {
        this.filterInput.value = "";
      }
    };
  };

  toggleFilterModePopup = () => {
    this.setState({filterModesOpen: !this.state.filterModesOpen});
  };

  renderFilterModePopup = () => {
    const active = (either(this.props.currentFilter)
      .map(f.matchesProperty("filterMode", FilterModes.CONTAINS))
      .getOrElse(true))
      ? 0
      : 1;
    return <FilterModePopup active={active}
                            close={this.toggleFilterModePopup}
                            setFilterMode={this.props.setFilterMode} />;
  };

  render() {
    let {t, currentFilter} = this.props;
    const filterInfoString = either(currentFilter.filterMode)
      .map(mode => f.prop([mode, "displayName"], SearchFunctions))
      .getOrElse("");
    const {filterValue, selectedSortColumn} = this.state;

    const canFilter = !f.isEmpty(filterValue) || selectedSortColumn !== null || f.isBoolean(filterValue);

    return (
      <div id="filter-popup">
        {(either(currentFilter).map(f.matchesProperty("filterColumnId", "noop")).getOrElse(false))
          ? (
            <div className="wip-filter-message">
              {i18n.t("table:filter.rows_hidden", {rowId: this.props.currentFilter.filterValue})}
            </div>
          )
          : (
            <div className="filter-row">
              <Select
                className="filter-select"
                options={this.getSearchableColumns()}
                searchable={true}
                clearable={false}
                value={this.state.selectedFilterColumn}
                onChange={this.onChangeSelectFilter}
                valueRenderer={this.selectFilterValueRenderer}
                noResultsText={t("input.noResult")}
                placeholder={t("input.filter")}
              />
              <span className="separator">{t(filterInfoString)}</span>

              {(this.state.selectedColumnKind === "boolean")
                ? <span onClick={() => this.setState({filterValue: !filterValue})} >
                  <input checked={filterValue}
                         onChange={function () {}}
                         type="checkbox"
                  />
                  {i18n.t((filterValue) ? "common:yes" : "common:no")}
                </span>
                : <span className="filter-mode-wrapper">
                  <input value={this.state.filterValue}
                         type="text"
                         className="filter-input"
                         disabled={this.state.selectedFilterColumn === null}
                         ref={fi => this.filterInput = fi}
                         onChange={this.filterInputChange}
                         onKeyDown={KeyboardShortcutsHelper.onKeyboardShortcut(this.getKeyboardShortcuts)}
                         onClick={x => this.filterInput.focus()}
                  />
                  <span className={"filter-mode-button" + ((this.state.filterModesOpen) ? " active" : "")}>
                    {(this.state.selectedFilterColumn !== null)
                      ? (
                        <a href="#"
                           className={(this.state.filterModesOpen) ? "ignore-react-clickoutside" : ""}
                           onMouseDown={this.toggleFilterModePopup}>
                          <i className="fa fa-search" />
                          <i className="fa fa-caret-down" />
                        </a>
                      )
                      : null}
                    {(this.state.filterModesOpen)
                      ? this.renderFilterModePopup()
                      : null
                    }
                  </span>
                </span>
              }
            </div>
          )}
        <div className="sort-row">
          <Select
            className="filter-select"
            options={this.getSortableColumns()}
            searchable={true}
            clearable={false}
            value={this.state.selectedSortColumn}
            onChange={this.onChangeSelectSortColumn}
            valueRenderer={this.selectFilterValueRenderer}
            noResultsText={t("input.noResult")}
            placeholder={t("input.sort")}
          />
          <span className="separator">{t("help.sort")}</span>
          <Select
            disabled={this.state.selectedSortColumn === null}
            className="filter-select"
            options={this.getSortOptions()}
            searchable={true}
            clearable={false}
            value={(this.state.selectedSortColumn !== null) ? this.state.sortValue : ""}
            onChange={this.onChangeSelectSortValue}
            valueRenderer={this.selectSortValueRenderer}
            optionRenderer={this.selectSortValueRenderer}
            noResultsText={t("input.noResult")}
            placeholder={""}
          />
        </div>
        <div className="description-row">
          <p className="info">
            <span className="text">{t("help.note")}</span></p>
          <button tabIndex="1" className="neutral"
                  onClick={this.clearFilter}>{t("button.clearFilter")}</button>
          <button tabIndex="0" className={(canFilter) ? "filter-go" : "filter-go neutral"} disabled={!canFilter}
                  onClick={this.filterUpdate}>{t("button.doFilter")}</button>
        </div>
      </div>
    );
  }

}

export default FilterPopup;
