import React from "react";
import * as _ from "lodash";
import * as f from "lodash/fp";
import ActionCreator from "../../../actions/ActionCreator";
import listensToClickOutside from "react-onclickoutside";
import Select from "react-select";
import {translate} from "react-i18next";
import TableauxConstants, {ColumnKinds, FilterModes, Langtags, SortValues} from "../../../constants/TableauxConstants";
import i18n from "i18next";
import {either} from "../../../helpers/monads";
import FilterRow, {BOOL, TEXT} from "./FilterRow";
import {FilterableCellKinds, SortableCellKinds} from "../../table/RowFilters";

const SPECIAL_SEARCHES = [FilterModes.ANY_UNTRANSLATED, FilterModes.UNTRANSLATED, FilterModes.FINAL];

@translate(["filter", "table"])
@listensToClickOutside
class FilterPopup extends React.Component {

  static propTypes = {
    langtag: React.PropTypes.string.isRequired,
    onClickedOutside: React.PropTypes.func.isRequired,
    columns: React.PropTypes.object,
    currentFilter: React.PropTypes.object
  };

  static isSortableColumn = (column) => f.contains(column.kind, SortableCellKinds);
  static isSearchableColumn = (column) => f.contains(column.kind, FilterableCellKinds);

  sortableColumns = null;
  searchableColumns = null;

  constructor(props) {
    super(props);
    const currFilter = props.currentFilter;

    const filter = {
      columnId: either(currFilter)
        .map(cf => {
          const mode = f.prop(["filterMode"], cf);
          return (f.contains(mode, SPECIAL_SEARCHES)) ? mode : null;
        })
        .orElse(f.compose(f.toString, f.prop("filterColumnId")))
        .getOrElse(null),
      mode: f.prop("filterMode", currFilter),
      value: f.prop("filterValue", currFilter),
      columnKind: f.prop("filterColumnKind", currFilter)
    };

    const sorting = {
      columnId: f.toString(f.prop("sortColumnId", currFilter)),
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
    const {langtag} = this.props;
    return [
      (langtag !== f.first(Langtags))
        ? {
        label: this.props.t("translations.this_translation_needed", {langtag}),
        value: FilterModes.UNTRANSLATED,
        kind: BOOL
      }
        : {
        label: this.props.t("filter.needs_translation"),
        value: FilterModes.ANY_UNTRANSLATED,
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

    return _.map(columns.models, (column) => {
      // Show display name with fallback to machine name
      const columnDisplayName = column.displayName[langtag] || column.name;
      // ID Column gets translated name
      const labelName = column.id === 0 ? t("concat_column_name") : columnDisplayName;

      return {
        label: labelName,
        value: f.toString(column.id),
        kind: column.kind,
        disabled: !filterFn(column)
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

  changeFilterValue = (event) => {
    const hasNodeType = tag => f.matchesProperty(["target", "tagName"], tag);
    f.cond([
      [hasNodeType("INPUT"), this.changeTextFilterValue],
      [f.stubTrue, this.toggleBoolFilter]
    ])(event);
  };
  changeTextFilterValue = (event) => {
    this.setState({filter: f.assoc("value", event.target.value, this.state.filter)});
  };
  toggleBoolFilter = () => {
    const {filter} = this.state;
    this.setState({filter: f.assoc("value", !filter.value, filter)});
  };

  changeFilterMode = mode => this.setState({
    filter: f.assoc("mode", mode, this.state.filter)
  });

  applyFilters = (event) => {
    const {filter, sorting} = this.state;
    const colIdToNumber = obj => f.assoc("columnId", parseInt(obj.columnId), obj);
    ActionCreator.changeFilter(colIdToNumber(filter), colIdToNumber(sorting));
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
    if (f.contains(value, SPECIAL_SEARCHES)) {
      const filter = {
        columnId: value,
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
      this.setState({filter});
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

  render() {
    const {t} = this.props;
    const {filter, sorting} = this.state;

    const sortColumnSelected = f.isInteger(parseInt(sorting.columnId));
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
          : <FilterRow searchableColumns={this.getSearchableColumns()}
                       valueRenderer={this.selectFilterValueRenderer}
                       onChangeColumn={this.onChangeSelectFilter}
                       onChangeValue={this.changeFilterValue}
                       onChangeMode={this.changeFilterMode}
                       filter={filter}
                       t={t}
          />}
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
                  onClick={this.applyFilters}>{t("button.doFilter")}</button>
        </div>
      </div>
    );
  }
}

export default FilterPopup;
