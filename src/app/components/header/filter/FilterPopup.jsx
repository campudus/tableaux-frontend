import { translate } from "react-i18next";
import React from "react";
import Select from "react-select";
import * as f from "lodash/fp";
import i18n from "i18next";
import listensToClickOutside from "react-onclickoutside";

import PropTypes from "prop-types";

import { FilterableCellKinds, SortableCellKinds } from "../../table/RowFilters";
import { either } from "../../../helpers/functools";
import { getColumnDisplayName } from "../../../helpers/multiLanguage";
import FilterPopupFooter from "./FilterPopupFooter";
import FilterPresetList from "./FilterPresetList";
import FilterRow, { BOOL, TEXT } from "./FilterRow";
import TableauxConstants, {
  ColumnKinds,
  FilterModes,
  Langtags,
  SortValues
} from "../../../constants/TableauxConstants";

const SPECIAL_SEARCHES = [
  FilterModes.ANY_UNTRANSLATED,
  FilterModes.UNTRANSLATED,
  FilterModes.FINAL,
  FilterModes.IMPORTANT,
  FilterModes.CHECK_ME,
  FilterModes.POSTPONE,
  FilterModes.ROW_CONTAINS,
  FilterModes.WITH_COMMENT
];

const SPECIAL_TEXT_SEARCHES = [FilterModes.ROW_CONTAINS];

@translate(["filter", "table"])
@listensToClickOutside
class FilterPopup extends React.Component {
  static isSortableColumn = column =>
    f.contains(column.kind, SortableCellKinds);
  static isSearchableColumn = column =>
    f.contains(column.kind, FilterableCellKinds);

  sortableColumns = null;
  searchableColumns = null;

  constructor(props) {
    super(props);

    const cleanFilter = filter => {
      return {
        columnId: either(filter)
          .map(cf => {
            const mode = f.get(["mode"], cf);
            return f.contains(mode, SPECIAL_SEARCHES) ? mode : null;
          })
          .orElse(
            f.flow(
              f.get("columnId"),
              f.toString
            )
          )
          .getOrElse(null),
        mode: f.get("mode", filter),
        value: f.get("value", filter),
        columnKind: f.get("columnKind", filter)
      };
    };

    const sorting = {
      columnId: f.get(["currentFilter", "sorting", "columnId"], props),
      value: f.getOr(
        TableauxConstants.SortValues.ASC,
        ["currentFilter", "sorting", "value"],
        props
      )
    };
    this.state = {
      sorting,
      filterModesOpen: false,
      filters: f
        .propOr([{}], ["currentFilter", "filters"], props)
        .map(cleanFilter)
    };

    this.sortableColumns = this.buildColumnOptions(
      FilterPopup.isSortableColumn
    );
    this.searchableColumns = this.buildColumnOptions(
      FilterPopup.isSearchableColumn
    );
  }

  addFilter = () => {
    this.setState({ filters: [...this.state.filters, {}] });
  };

  removeFilter = (idx = this.state.filters.length - 1) => () => {
    this.setState({ filters: f.pullAt(idx, this.state.filters) });
  };

  getSortableColumns() {
    return (
      this.sortableColumns ||
      (this.sortableColumns = this.buildColumnOptions(
        FilterPopup.isSortableColumn()
      ))
    );
  }

  getSearchableColumns() {
    const searchableColumns =
      this.searchableColumns ||
      (this.searchableColumns = this.buildColumnOptions(
        FilterPopup.isSearchableColumn()
      ));
    const { langtag } = this.props;
    return [
      {
        label: f.toUpper(this.props.t("table:filter.generic")),
        disabled: true
      },
      langtag !== f.first(Langtags)
        ? {
            label: this.props.t("table:translations.this_translation_needed", {
              langtag
            }),
            value: FilterModes.UNTRANSLATED,
            kind: BOOL
          }
        : {
            label: this.props.t("table:filter.needs_translation"),
            value: FilterModes.ANY_UNTRANSLATED,
            kind: BOOL
          },
      {
        label: this.props.t("table:filter.is_final"),
        value: FilterModes.FINAL,
        kind: BOOL
      },
      {
        label: this.props.t("table:important"),
        value: FilterModes.IMPORTANT,
        kind: BOOL
      },
      {
        label: this.props.t("table:check-me"),
        value: FilterModes.CHECK_ME,
        kind: BOOL
      },
      {
        label: this.props.t("table:postpone"),
        value: FilterModes.POSTPONE,
        kind: BOOL
      },
      {
        label: this.props.t("filter:has-comments"),
        value: FilterModes.WITH_COMMENT,
        kind: BOOL
      },
      {
        label: f.toUpper(this.props.t("table:filter.specific")),
        disabled: true
      },
      {
        label: this.props.t("table:filter.row-contains"),
        value: FilterModes.ROW_CONTAINS,
        kind: TEXT
      },
      ...searchableColumns
    ];
  }

  buildColumnOptions(filterFn) {
    const { columns, langtag } = this.props;

    return columns.map(column => {
      const columnDisplayName = getColumnDisplayName(column, langtag);

      return {
        label: columnDisplayName,
        value: f.toString(column.id),
        kind: column.kind,
        disabled: !filterFn(column)
      };
    });
  }

  getSortOptions() {
    const { t } = this.props;

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

  changeFilterValue = idx => event => {
    const hasNodeType = tag => f.matchesProperty(["target", "tagName"], tag);
    f.cond([
      [hasNodeType("INPUT"), this.changeTextFilterValue(idx)],
      [f.stubTrue, this.toggleBoolFilter(idx)]
    ])(event);
  };
  changeTextFilterValue = idx => event => {
    this.setState({
      filters: f.assoc([idx, "value"], event.target.value, this.state.filters)
    });
  };
  toggleBoolFilter = idx => () => {
    const { filters } = this.state;
    this.setState({
      filters: f.assoc([idx, "value"], !f.get([idx, "value"], filters), filters)
    });
  };

  changeFilterMode = idx => mode => {
    this.setState({
      filters: f.assoc([idx, "mode"], mode, this.state.filters)
    });
  };

  applyFilters = event => {
    const { filters, sorting } = this.state;
    const { setRowFilter } = this.props;
    const colIdToNumber = obj =>
      f.assoc("columnId", parseInt(obj.columnId), obj);
    setRowFilter(
      f.map(colIdToNumber, filters),
      colIdToNumber(sorting),
      "shouldSave"
    );
    this.handleClickOutside(event);
  };

  clearFilter = event => {
    const { setRowFilter } = this.props;
    setRowFilter([], {}, "shouldSave");
    this.handleClickOutside(event);
  };

  handleClickOutside = event => {
    this.props.onClickedOutside(event);
  };

  selectFilterValueRenderer = option => {
    return (
      <div>
        <span>{option.label}</span>
      </div>
    );
  };

  selectSortValueRenderer = option => {
    if (option.value === TableauxConstants.SortValues.ASC) {
      return (
        <div>
          <i className="fa fa-sort-alpha-asc" /> {option.label}
        </div>
      );
    } else {
      return (
        <div>
          <i className="fa fa-sort-alpha-desc" /> {option.label}
        </div>
      );
    }
  };

  filtersForKind = kind => {
    return f.cond([
      [f.eq(ColumnKinds.boolean), f.always("boolean")],
      [f.eq(ColumnKinds.number), f.always("text")],
      [f.stubTrue, f.always("text")]
    ])(kind);
  };

  onChangeFilterColumn = idx => option => {
    const { value, kind } = option;
    const oldFilter = f.defaultTo({})(f.get(["filters", idx]));
    if (f.contains(value, SPECIAL_SEARCHES)) {
      const filter = {
        columnId: value,
        mode: value,
        columnKind: f.contains(value, SPECIAL_TEXT_SEARCHES) ? TEXT : BOOL,
        value: true
      };
      this.setState({ filters: f.assoc([idx], filter, this.state.filters) });
    } else {
      const defaultMode = FilterModes.CONTAINS;
      const oldValue = oldFilter.value;
      const filterMode =
        oldFilter.columnKind === BOOL
          ? defaultMode
          : oldFilter.mode || defaultMode;
      const columnKind = this.filtersForKind(kind);
      const filter = {
        mode: columnKind === ColumnKinds.boolean ? BOOL : filterMode,
        columnId: value,
        value:
          columnKind === ColumnKinds.boolean
            ? true
            : f.isString(oldValue)
            ? oldValue
            : "",
        columnKind
      };
      this.setState({ filters: f.assoc([idx], filter, this.state.filters) });
    }
  };

  onChangeSelectSortColumn = selection => {
    const { value } = selection;
    const sortValue = f.defaultTo(SortValues.ASC)(
      f.prop(["sorting", "sortvalue"], this.state)
    );
    this.setState({
      sorting: {
        columnId: value,
        value: sortValue
      }
    });
  };

  onChangeSelectSortValue = selection => {
    if (f.isObject(selection) && !f.isNil(selection.value)) {
      this.setState({
        sorting: f.assoc("value", selection.value, this.state.sorting)
      });
    }
  };

  clearSorting = () => {
    this.onChangeSelectSortColumn({});
  };

  render() {
    const { t } = this.props;
    const { sorting } = this.state;

    const filters = f.isEmpty(this.state.filters)
      ? [
          {
            mode: FilterModes.CONTAINS,
            value: null,
            columnId: null
          }
        ]
      : this.state.filters;

    const sortColumnSelected = f.isInteger(parseInt(sorting.columnId));
    const hasFilterValue = filter =>
      (filter.columnKind === TEXT &&
        f.isString(filter.value) &&
        !f.isEmpty(filter.value)) ||
      (filter.columnKind === BOOL && f.isBoolean(filter.value));
    const anyFilterHasValue = f.flow(
      f.map(hasFilterValue),
      f.any(f.identity)
    )(filters);
    const canApplyFilter = sortColumnSelected || anyFilterHasValue;
    const sortOptions = this.getSortOptions();

    console.log({ canApplyFilter, sortColumnSelected, anyFilterHasValue });

    const allColumns = this.getSearchableColumns();
    const selectedByOtherFilters = idx =>
      f.flow(
        f.map("columnId"),
        f.pull(filters[idx].columnId) // remove element selected by this filter
      )(filters);
    const isSelectedByOtherFilter = idx =>
      f.flow(
        f.get("value"),
        v => f.contains(v, selectedByOtherFilters(idx))
      );
    const availableColumns = idx =>
      f.reject(isSelectedByOtherFilter(idx), allColumns);

    return (
      <div className="filter-popup">
        <section className="filter-popup__content-section">
          <header className="filter-popup__header">
            <div className="filter-popup__heading">
              {i18n.t("table:filter.filters")}
            </div>
            <button className="filter-popup__save-link-button">
              <i className="fa fa-save" />
              Filter speichern
            </button>
          </header>

          {filters.map((filter, idx) => {
            const isIDFilter = either(filter)
              .map(f.matchesProperty("mode", FilterModes.ID_ONLY))
              .getOrElse(false);
            return isIDFilter ? (
              <div className="wip-filter-message" key={idx}>
                {i18n.t("table:filter.rows_hidden", {
                  rowId: this.props.currentFilter.filterValue
                })}
              </div>
            ) : (
              <FilterRow
                searchableColumns={availableColumns(idx)}
                valueRenderer={this.selectFilterValueRenderer}
                onChangeColumn={this.onChangeFilterColumn(idx)}
                onChangeValue={this.changeFilterValue(idx)}
                onChangeMode={this.changeFilterMode(idx)}
                onAddFilter={
                  idx === filters.length - 1 && filters.length < 6
                    ? this.addFilter
                    : null
                }
                onRemoveFilter={
                  filters.length > 1 ? this.removeFilter(idx) : null
                }
                filter={filter}
                applyFilters={this.applyFilters}
                key={idx}
                t={t}
              />
            );
          })}
        </section>

        <section className="filter-popup__content-section filter-popup-sorting-section">
          <header className="filter-popup__header">
            <div className="filter-popup__heading">
              {i18n.t("table:filter.sorting")}
            </div>
          </header>
          <div className="sort-row">
            <button className="filter-array-button" onClick={this.clearSorting}>
              <i className="fa fa-trash" />
            </button>
            <Select
              className="filter-select"
              options={this.getSortableColumns()}
              searchable={true}
              openOnFocus
              clearable={false}
              value={sorting.columnId}
              onChange={this.onChangeSelectSortColumn}
              valueRenderer={this.selectFilterValueRenderer}
              noResultsText={t("filter:input.noResult")}
              placeholder={t("filter:input.sort")}
            />
            <div className="separator"></div>
            <Select
              disabled={!sortColumnSelected}
              className="filter-select"
              options={sortOptions}
              searchable={false}
              clearable={false}
              value={sortColumnSelected ? sorting.value : ""}
              onChange={this.onChangeSelectSortValue}
              valueRenderer={this.selectSortValueRenderer}
              optionRenderer={this.selectSortValueRenderer}
              noResultsText={t("filter:input.noResult")}
              placeholder=""
            />
          </div>
        </section>

        <FilterPopupFooter
          canApplyFilters={!!canApplyFilter}
          applyFilters={this.applyFilters}
          clearFilters={this.clearFilter}
          filters={filters}
          sorting={sorting}
        />

        <FilterPresetList langtag={this.props.langtag} />
      </div>
    );
  }
}

export default FilterPopup;

FilterPopup.propTypes = {
  langtag: PropTypes.string.isRequired,
  onClickedOutside: PropTypes.func.isRequired,
  columns: PropTypes.array.isRequired,
  setRowFilter: PropTypes.func.isRequired,
  currentFilter: PropTypes.object
};
