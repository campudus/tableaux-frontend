import React from "react";
import * as _ from "lodash";
import * as f from "lodash/fp";
import ActionCreator from "../../../actions/ActionCreator";
import listensToClickOutside from "react-onclickoutside";
import KeyboardShortcutsHelper from "../../../helpers/KeyboardShortcutsHelper";
import Select from "react-select";
import FilterModePopup from "./FilterModePopup";
import {translate} from "react-i18next";
import TableauxConstants, {FilterModes, ColumnKinds, SortValues} from "../../../constants/TableauxConstants";
import i18n from "i18next";
import {either} from "../../../helpers/monads";
import SearchFunctions from "../../../helpers/searchFunctions";

const BOOL = "boolean";
const TEXT = "text";

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
    const currFilter = props.currentFilter;

    const filter = {
      columnId: f.defaultTo(null)(f.toNumber(f.prop(["filterColumnId"], currFilter))),
      mode: f.prop("filterMode", currFilter),
      value: f.prop("filterValue", currFilter),
      columnKind: f.prop("filterColumnKind", currFilter)
    };

    const sorting = {
      columnId: f.prop("sortColumnId", currFilter),
      value: f.defaultTo(TableauxConstants.SortValues.ASC)(f.prop("sortValue", currFilter))
    };

    this.state = {
      filter,
      sorting,
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
        label: this.props.t("filter.needs_translation"),
        value: FilterModes.UNTRANSLATED,
        kind: BOOL
      },
      {
        label: this.props.t("filter.is_final"),
        value: FilterModes.FINAL,
        kind: BOOL
      },
      ...searchableColumns
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
    this.setState({filter: f.assoc("value", event.target.value, this.state.filter)});
  };

  filterUpdate = (event) => {
    const {filter, sorting} = this.state;
    ActionCreator.changeFilter(filter, sorting);
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
    return f.cond([
      [f.eq(ColumnKinds.boolean), f.always("boolean")],
      [f.eq(ColumnKinds.number), f.always("text")],
      [f.stubTrue, f.always("text")]
    ])(kind);
  };

  onChangeSelectFilter = option => {
    const {value, kind} = option;
    if (f.contains(value, [FilterModes.UNTRANSLATED, FilterModes.FINAL])) {
      const filter = {
        columnId: null,
        mode: value,
        columnKind: BOOL,
        value: true
      };
      this.setState({filter});
    } else {
      const defaultMode = FilterModes.CONTAINS;
      const oldValue = this.state.filter.value;
      const filterMode = (this.state.filter.columnKind === BOOL)
        ? defaultMode
        : this.state.filter.mode || defaultMode;
      const filter = {
        mode: filterMode,
        columnId: value,
        value: f.isString(oldValue) ? oldValue : "",
        columnKind: this.filtersForKind(kind)
      };
      this.setState({filter})
    }
  };

  onChangeSelectSortColumn = (selection) => {
    const {value} = selection;
    const sortValue = f.defaultTo(SortValues.ASC)(f.prop(["sorting", "sortvalue"], this.state));
    this.setState({
      sorting: {
        columnId: value,
        value: sortValue
      }
    });
  };

  onChangeSelectSortValue = (selection) => {
    this.setState({sorting: f.assoc("value", selection.value, this.state.sorting)});
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
                            setFilterMode={(mode) => this.setState({
                              filter: f.assoc("mode",
                                mode,
                                this.state.filter)
                            })} />;
  };

  render() {
    let {t} = this.props;
    const {filter, sorting} = this.state;
    const filterInfoString = either(filter.mode)
      .map(mode => f.prop([mode, "displayName"], SearchFunctions))
      .getOrElse("");

    const filterColumnSelected = f.isInteger(filter.columnId);
    const sortColumnSelected = f.isInteger(sorting.columnId);
    const hasFilterValue = (filter.columnKind === TEXT && f.isString(filter.value) && !f.isEmpty(filter.value))
      || (filter.columnKind === BOOL && f.isBoolean(filter.value));
    const canApplyFilter = sortColumnSelected || hasFilterValue;
    const sortOptions = this.getSortOptions();

    return (
      <div id="filter-popup">
        {(either(filter).map(f.matchesProperty("mode", FilterModes.ID_ONLY)).getOrElse(false))
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
                value={filter.columnId}
                onChange={this.onChangeSelectFilter}
                valueRenderer={this.selectFilterValueRenderer}
                noResultsText={t("input.noResult")}
                placeholder={t("input.filter")}
              />
              <span className="separator">{t(filterInfoString)}</span>

              {(filter.columnKind === BOOL)
                ? <span onClick={() => this.setState({filter: f.assoc("value", !filter.value, filter)})}>
                  <input checked={!!f.prop("value", filter)}
                         value={!!f.prop("value", filter)}
                         onChange={() => {}}
                         type="checkbox"
                  />
                  {i18n.t((filter.value) ? "common:yes" : "common:no")}
                </span>
                : <span className="filter-mode-wrapper">
                  <input value={filter.value}
                         type="text"
                         className="filter-input"
                         disabled={!filterColumnSelected}
                         ref={fi => this.filterInput = fi}
                         onChange={this.filterInputChange}
                         onKeyDown={KeyboardShortcutsHelper.onKeyboardShortcut(this.getKeyboardShortcuts)}
                         onClick={x => this.filterInput.focus()}
                  />
                  <span className={"filter-mode-button" + ((this.state.filterModesOpen) ? " active" : "")}>
                    {(filterColumnSelected)
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
            value={sorting.columnId}
            onChange={this.onChangeSelectSortColumn}
            valueRenderer={this.selectFilterValueRenderer}
            noResultsText={t("input.noResult")}
            placeholder={t("input.sort")}
          />
          <span className="separator">{t("help.sort")}</span>
          <Select
            disabled={!sortColumnSelected}
            className="filter-select"
            options={sortOptions}
            searchable={true}
            clearable={false}
            value={(sortColumnSelected) ? sorting.value : ""}
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
          <button tabIndex="0"
                  className={(canApplyFilter) ? "filter-go" : "filter-go neutral"}
                  disabled={!canApplyFilter}
                  onClick={this.filterUpdate}>{t("button.doFilter")}</button>
        </div>
      </div>
    );
  }

}

export default FilterPopup;
