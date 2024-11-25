import i18n from "i18next";
import f from "lodash/fp";
import PropTypes from "prop-types";
import React, { useEffect, useRef, useState } from "react";
import { translate } from "react-i18next";
import listensToClickOutside from "react-onclickoutside";
import { useSelector } from "react-redux";
import Select from "react-select";
import TableauxConstants, {
  ColumnKinds,
  FilterModes,
  Langtags,
  RowIdColumn,
  SortValues
} from "../../../constants/TableauxConstants";
import { either } from "../../../helpers/functools";
import { getColumnDisplayName } from "../../../helpers/multiLanguage";
import { canColumnBeSearched } from "../../../helpers/searchFunctions";
import { outsideClickEffect } from "../../../helpers/useOutsideClick";
import store from "../../../redux/store";
import RowFilters from "../../../RowFilters/index";
import { SortableCellKinds } from "../../table/RowFilters";
import FilterPopupFooter from "./FilterPopupFooter";
import FilterPresetList from "./FilterPresetList";
import FilterRow, { BOOL, TEXT } from "./FilterRow";
import FilterSavingPopup from "./FilterSavingPopup";
import { fromCombinedFilter, toCombinedFilter } from "./helpers";

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
    column.id !== RowIdColumn.id && canColumnBeSearched(column);

  sortableColumns = null;
  searchableColumns = null;
  statusFilters = null;

  constructor(props) {
    super(props);

    const cleanFilter = filter => {
      return {
        columnId: either(filter)
          .map(cf => {
            const mode = f.get(["mode"], cf);
            return f.contains(mode, SPECIAL_SEARCHES)
              ? mode
              : cf.mode === FilterModes.STATUS
              ? cf.compareValue
              : null;
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
        compareValue: f.get("compareValue", filter),
        colId: f.get("colId", filter),
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
      savePopupOpen: false,
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

  calcStatusFilters = statusColumn => {
    const { rules, id } = statusColumn;
    const { langtag } = this.props;
    return f.map(rule => {
      const value = f.get(["displayName", langtag], rule);
      return {
        value,
        label: value,
        kind: FilterModes.STATUS,
        columnId: value,
        colId: id
      };
    }, rules);
  };

  getSearchableColumns() {
    const searchableColumns =
      this.searchableColumns ||
      (this.searchableColumns = this.buildColumnOptions(
        FilterPopup.isSearchableColumn()
      ));
    const { langtag, columns } = this.props;
    const maybeStatusColumn = f.find({ kind: ColumnKinds.status }, columns);
    const statusFilters =
      this.statusFilters || maybeStatusColumn
        ? this.calcStatusFilters(maybeStatusColumn)
        : [];
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
        label: f.toUpper(this.props.t("filter:status")),
        disabled: true
      },
      ...statusFilters,
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

    return columns
      .filter(column => column.kind !== ColumnKinds.status)
      .map(column => {
        const columnDisplayName = getColumnDisplayName(column, langtag);

        return {
          // ...column, // TODO: may be required if we need more specific predicates, but could break persisted filter state
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
    void f.cond([
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
    const { setRowFilter, actions, langtag } = this.props;
    const tableId = f.prop("tableView.currentTable", store.getState());
    actions.toggleCellSelection({ select: false, langtag, tableId });
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
      [f.eq(ColumnKinds.status), f.always("status")],
      [f.stubTrue, f.always("text")]
    ])(kind);
  };

  onChangeFilterColumn = idx => option => {
    const { value, kind } = option;
    const oldFilter = f.defaultTo({})(f.get(["filters", idx]));
    let filter;
    if (f.contains(value, SPECIAL_SEARCHES)) {
      filter = {
        columnId: value,
        mode: value,
        columnKind: f.contains(value, SPECIAL_TEXT_SEARCHES) ? TEXT : BOOL,
        value: true
      };
    } else if (kind === "STATUS") {
      const { columnId, label, colId } = option;
      filter = {
        mode: "STATUS",
        columnKind: "status",
        value: true,
        compareValue: value,
        columnId,
        label,
        colId
      };
    } else {
      const defaultMode = FilterModes.CONTAINS;
      const oldValue = oldFilter.value;
      const filterMode =
        oldFilter.columnKind === BOOL
          ? defaultMode
          : oldFilter.mode || defaultMode;
      const columnKind = this.filtersForKind(kind);
      filter = {
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
    }
    this.setState({ filters: f.assoc([idx], filter, this.state.filters) });
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

  toggleFilterSavingPopup = () => {
    this.setState(f.update("savePopupOpen", open => !open));
  };
  closeFilterSavingPopup = () => this.setState(f.assoc("savePopupOpen", false));

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
      ((filter.columnKind === BOOL || filter.mode === FilterModes.STATUS) &&
        f.isBoolean(filter.value)) ||
      filter.mode === FilterModes.IS_EMPTY;
    const anyFilterHasValue = f.flow(
      f.map(hasFilterValue),
      f.any(f.identity)
    )(filters);
    const canApplyFilter = sortColumnSelected || anyFilterHasValue;
    const sortOptions = this.getSortOptions();

    const allColumns = this.getSearchableColumns();
    const selectedByOtherFilters = idx =>
      f.flow(
        f.map("columnId"),
        f.pull(filters[idx].columnId) //  remove element selected by this filter
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
        {this.state.savePopupOpen && (
          <FilterSavingPopup
            filters={filters}
            templates={[]}
            saveTemplate={() => null}
            columns={allColumns}
            handleClickOutside={this.closeFilterSavingPopup}
          />
        )}
        <section className="filter-popup__content-section">
          <header className="filter-popup__header">
            <div className="filter-popup__heading">
              {i18n.t("table:filter.filters")}
            </div>
            <button
              className={
                "filter-popup__save-link-button" +
                (this.state.savePopupOpen ? " ignore-react-onclickoutside" : "")
              }
              onClick={this.toggleFilterSavingPopup}
              disabled={!canApplyFilter}
            >
              <i className="fa fa-save" />
              {i18n.t("table:filter.save-filter")}
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
                columns={this.props.columns}
                settings={{}}
                langtag={this.props.langtag}
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
          langtag={this.props.langtag}
        />

        <FilterPresetList
          langtag={this.props.langtag}
          closeFilterPopup={this.handleClickOutside}
        />
      </div>
    );
  }
}

FilterPopup.propTypes = {
  langtag: PropTypes.string.isRequired,
  onClickedOutside: PropTypes.func.isRequired,
  columns: PropTypes.array.isRequired,
  setRowFilter: PropTypes.func.isRequired,
  currentFilter: PropTypes.object
};

const of = el => (Array.isArray(el) ? el : [el]);

const TheFilterPopup = ({
  actions,
  columns,
  langtag,
  onClickedOutside,
  currentFilter
}) => {
  const tableId = useSelector(f.prop("tableView.currentTable"));
  const containerRef = useRef();
  useEffect(
    outsideClickEffect({
      containerRef,
      onOutsideClick: onClickedOutside,
      shouldListen: true
    }),
    [containerRef.current]
  );

  console.log("CURRENT FILTER", JSON.stringify(currentFilter));
  const [rowFilters, setRowFilters] = useState(
    f.isEmpty(currentFilter.filters)
      ? [{}]
      : of(fromCombinedFilter(columns)(currentFilter.filters))
  );
  const [annotationFilters, setAnnotationFilters] = useState({});

  const toggleAnnotationFilter = key => () =>
    void setAnnotationFilters({
      ...annotationFilters,
      [key]: !annotationFilters[key]
    });
  const annotationFilterTemplates = {
    final: ["row-prop", "final", "is-set"],
    important: ["annotation", "flag-type", "important", "is-set"],
    postpone: ["annotation", "flag-type", "postpone", "is-set"],
    doubleCheck: ["annotation", "flag-type", "double-check", "is-set"],
    hasComments: ["annotation", "type", "info", "is-set"],
    needsAnyTranslation: [
      "annotation",
      "flag-type",
      "needs_translation",
      "is-set"
    ],
    needsMyTranslation: [
      "annotation",
      "flag-type",
      "needs_translation",
      "has-language",
      langtag
    ]
  };

  const filterList = toCombinedFilter([
    ...rowFilters.map(settingToFilter).filter(f.complement(f.isEmpty)),
    ...Object.entries(annotationFilters)
      .filter(([_, isSet]) => isSet)
      .map(([key]) => annotationFilterTemplates[key])
  ]);
  const settingsAreValid = filterList.length > 0;

  const handleSubmit = () => {
    actions.toggleCellSelection({ select: false, langtag, tableId });
    actions.setFiltersAndSorting(filterList, [], true);
  };
  const handleClearFilters = () => {
    setRowFilters([{}]);
    actions.setFiltersAndSorting([], [], true);
  };
  return (
    <div className="filter-popup" ref={containerRef}>
      <section className="filter-popup__content-section">
        <header className="filter-popup__header">
          <div className="filter-popup__heading">
            {i18n.t("table:filter.filters")}
          </div>
        </header>
        <div>
          <ColumnFilterArea
            langtag={langtag}
            columns={columns}
            onChange={setRowFilters}
            filters={rowFilters}
          />
          <AnnotationFilterArea
            langtag={langtag}
            options={Object.keys(annotationFilterTemplates)}
            filters={annotationFilters}
            onToggle={toggleAnnotationFilter}
          />
        </div>
      </section>
      <FilterPopupFooter
        applyFilters={handleSubmit}
        clearFilters={handleClearFilters}
        canApplyFilters={settingsAreValid}
      />
    </div>
  );
};

export default TheFilterPopup;

const settingToFilter = ({ column, mode, value }) => {
  const modes = RowFilters.ModesForKind[(column?.kind)];
  const needsValueArg = (modes && modes[mode])?.length > 0; // The `length` of a function is its arity
  const hasValue = !f.isNil(value) && value !== "";
  return !column || !mode || (needsValueArg && !hasValue)
    ? null
    : ["value", column.name, mode, value];
};

const AnnotationFilterArea = ({ onToggle, filters, options, langtag }) => {
  const isPrimaryLang = langtag === TableauxConstants.DefaultLangtag;
  const shouldDropFilter = isPrimaryLang
    ? f.eq("needsMyTranslation")
    : f.eq("needsAnyTranslation");
  const shouldKeepFilter = f.complement(shouldDropFilter);

  return (
    <div className="annotation-filters">
      {options.filter(shouldKeepFilter).map(kind => (
        <div className="annotation-filter" key={kind} onClick={onToggle(kind)}>
          <div className="annotation-filter__label">{i18n.t(kind)}</div>
          <div className="annotation-filter__checkbox">
            <input
              type="checkbox"
              checked={Boolean(filters[kind])}
              onChange={f.noop}
            />
          </div>
        </div>
      ))}
    </div>
  );
};
const ColumnFilterArea = ({ columns, filters, langtag, onChange }) => {
  const addFilterRow = () => onChange([...filters, {}]);
  const removeFilterRow = idxToRemove => () =>
    void onChange(filters.filter((_, idx) => idx !== idxToRemove));
  const updateFilterRow = idxToChange => settings =>
    onChange(filters.map((row, idx) => (idx === idxToChange ? settings : row)));
  return (
    <div className="column-filters">
      {filters.map((filterRow, idx) => (
        <FilterRow
          key={idx}
          columns={columns}
          langtag={langtag}
          settings={filterRow}
          onChange={updateFilterRow(idx)}
          onRemove={
            filters.length < 2
              ? () => updateFilterRow(0)({})
              : removeFilterRow(idx)
          }
        />
      ))}
      <button className="button button--add-filter" onClick={addFilterRow}>
        <i className="fa fa-plus" />
        {"add filter"}
      </button>
    </div>
  );
};
