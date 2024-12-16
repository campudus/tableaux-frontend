import { t } from "i18next";
import f from "lodash/fp";
import { match, otherwise, when } from "match-iz";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import Select from "react-select";
import TableauxConstants, {
  SortValue
} from "../../../constants/TableauxConstants";
import { buildClassName } from "../../../helpers/buildClassName";
import * as Storage from "../../../helpers/localStorage";
import { getColumnDisplayName } from "../../../helpers/multiLanguage";
import { outsideClickEffect } from "../../../helpers/useOutsideClick";
import RowFilters from "../../../RowFilters";
import FilterPopupFooter from "./FilterPopupFooter";
import FilterRow from "./FilterRow";
import FilterSavingPopup, {
  RestoreSavedFiltersArea
} from "./FilterSavingPopup";
import {
  fromCombinedFilter,
  getAnnotationColor,
  getAnnotationTitle,
  mkAnnotationFilterTemplates,
  toCombinedFilter
} from "./helpers";

const of = el => (Array.isArray(el) ? el : [el]);

const FilterPopup = ({
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
  const [showFilterSavePopup, setShowFilterSavePopup] = useState(false);

  const parseFilterSettings = fromCombinedFilter(columns, langtag);
  const parsedFilterSettings = parseFilterSettings(currentFilter.filters || []);
  const toRowFilterArray = rowFilters =>
    f.isEmpty(rowFilters) ? [{}] : of(rowFilters);
  const [rowFilters, setRowFilters] = useState(
    toRowFilterArray(parsedFilterSettings.rowFilters)
  );
  const [annotationFilters, setAnnotationFilters] = useState(
    parsedFilterSettings.annotationFilters
  );
  const [ordering, setOrdering] = useState({
    ...(currentFilter.sorting ?? {}),
    direction: currentFilter.sorting?.direction ?? SortValue.asc
  });

  const [userFilters, setUserFilters] = useState(
    f.propOr({}, "*", Storage.getStoredViewObject())
  );
  const handleSetFromUserFilter = template => {
    const parsedTemplate = parseFilterSettings(template);
    setRowFilters(toRowFilterArray(parsedTemplate.rowFilters));
    setAnnotationFilters(parsedTemplate.annotationFilters);
    actions.setFiltersAndSorting(template, [], true);
  };
  const handleStoreUserFilter = (title, template) => {
    Storage.saveFilterSettings("*", { filters: template }, title);
    setUserFilters(f.propOr({}, "*", Storage.getStoredViewObject()));
  };
  const handleClearUserFilter = title => {
    const cleared = f.dissoc(title, userFilters);
    const tableViews = JSON.stringify(
      localStorage.getItem("tableViews") ?? "{}"
    );
    localStorage.setItem(
      "tableViews",
      JSON.stringify({ ...tableViews, ["*"]: cleared })
    );
    setUserFilters(cleared);
  };

  const toggleAnnotationFilter = key => () =>
    void setAnnotationFilters({
      ...annotationFilters,
      [key]: !annotationFilters[key]
    });

  const annotationFilterTemplates = useMemo(
    () => mkAnnotationFilterTemplates(langtag),
    [langtag]
  );

  const filterList = toCombinedFilter([
    ...rowFilters.map(settingToFilter).filter(f.complement(f.isEmpty)),
    ...Object.entries(annotationFilters)
      .filter(([_, isSet]) => isSet)
      .map(([key]) => annotationFilterTemplates[key])
  ]);
  const settingsAreValid = filterList.length > 0 || Boolean(ordering.colName);

  const handleSubmit = () => {
    actions.toggleCellSelection({ select: false, langtag, tableId });
    actions.setFiltersAndSorting(filterList, ordering, true);
  };
  const handleClearFilters = () => {
    setRowFilters([{}]);
    setAnnotationFilters({});
    setOrdering({ direction: SortValue.asc });
    actions.setFiltersAndSorting([], [], true);
  };
  return (
    <div className="filter-popup" ref={containerRef}>
      <section className="filter-popup__content-section">
        <header className="filter-popup__header">
          <div className="filter-popup__heading">
            {t("table:filter.filters")}
          </div>
          <button
            className="button button--open-save-overlay"
            onClick={() => setShowFilterSavePopup(true)}
            disabled={!settingsAreValid}
          >
            {t("table:filter.save-filter")}
          </button>
        </header>
        <div className="filter-settings">
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
        <SortingArea
          columns={columns}
          onChange={setOrdering}
          ordering={ordering}
          langtag={langtag}
        />
        <FilterPopupFooter
          applyFilters={handleSubmit}
          clearFilters={handleClearFilters}
          canApplyFilters={settingsAreValid}
        />
        {f.isEmpty(userFilters) ? null : (
          <RestoreSavedFiltersArea
            columns={columns}
            onClear={handleClearUserFilter}
            onSubmit={handleSetFromUserFilter}
            storedFilters={userFilters}
          />
        )}
      </section>

      {showFilterSavePopup ? (
        <FilterSavingPopup
          filters={filterList}
          onClose={() => setShowFilterSavePopup(false)}
          onSubmit={handleStoreUserFilter}
        />
      ) : null}
    </div>
  );
};

export default FilterPopup;

const SortingArea = ({ columns, onChange, ordering, langtag }) => {
  const options = columns
    .filter(column => RowFilters.canSortByColumnKind(column.kind))
    .map(column => ({
      label: getColumnDisplayName(column, langtag),
      value: column.name
    }));

  const handleChangeColumn = option =>
    void onChange({ ...ordering, colName: option.value });
  const handleChangeDirection = option =>
    void onChange({ ...ordering, direction: option.value });
  const handleClear = () => void onChange({ direction: SortValue.asc });

  return (
    <div className="sorting-area">
      <header className="filter-popup__header">
        <span className="filter-popup__heading">
          {t("table:filter.sorting")}
        </span>
      </header>
      <div className="content sorting-area__content">
        <Select
          options={options}
          value={ordering?.colName}
          onChange={handleChangeColumn}
          placehoder={t("filter:input.sort")}
        />
        <Select
          options={[
            { value: SortValue.asc, label: t("filter:help.sortasc") },
            { value: SortValue.desc, label: t("filter:help.sortdesc") }
          ]}
          value={ordering?.direction ?? SortValue.asc}
          onChange={handleChangeDirection}
          placeholder={t("table:filter.choose-sort-direction")}
        />
        <button
          className="button button--reset-sorting"
          disabled={!ordering.colName}
          onClick={handleClear}
        >
          <i className="fa fa-trash" />
        </button>
      </div>
    </div>
  );
};

const settingToFilter = ({ column, mode, value }) => {
  const needsValueArg = RowFilters.needsFilterValue(column?.kind, mode);
  const hasValue = !f.isNil(value) && value !== "";
  const isIncomplete = !column || !mode || (needsValueArg && !hasValue);
  const isIdFilter = column?.name === "rowId";
  return match({ isIncomplete, isIdFilter })(
    when({ isIncomplete: true }, () => null),
    when({ isIdFilter: true }, () => ["row-prop", "id", mode, value]),
    otherwise(() => ["value", column.name, mode, value])
  );
};

const AnnotationFilterArea = ({ onToggle, filters, options, langtag }) => {
  const isPrimaryLang = langtag === TableauxConstants.DefaultLangtag;
  const shouldDropFilter = isPrimaryLang
    ? f.eq("needsMyTranslation")
    : f.eq("needsAnyTranslation");
  const shouldKeepFilter = f.complement(shouldDropFilter);
  const hasNoBadge = kind => ["final", "info"].includes(kind);

  return (
    <div className="annotation-filters">
      <div className="annotation-filter__list">
        {options
          .filter(shouldKeepFilter)
          .filter(hasNoBadge)
          .map(kind => (
            <div
              className="annotation-filter"
              key={kind}
              onClick={onToggle(kind)}
            >
              <div className="annotation-filter__label">
                {getAnnotationTitle(kind)}
              </div>
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
      <div className="annotation-filter__badges">
        {options
          .filter(shouldKeepFilter)
          .filter(f.complement(hasNoBadge))
          .map(kind => (
            <AnnotationBadge
              key={kind}
              onClick={onToggle(kind)}
              active={Boolean(filters[kind])}
              color={getAnnotationColor(kind)}
              title={getAnnotationTitle(kind, langtag)}
            />
          ))}
      </div>
    </div>
  );
};
const AnnotationBadge = ({ title, onClick, active, color }) => {
  const cssClass = buildClassName("annotation-badge", { active });
  const style = active
    ? { color: "white", borderColor: color, background: color }
    : { color, borderColor: color, background: "white" };

  return (
    <button onClick={onClick} className={cssClass} style={style}>
      {title}
    </button>
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
      <div className="column-filters__list">
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
      </div>
      <button className="button button--add-filter" onClick={addFilterRow}>
        <i className="fa fa-plus" />
        {t("table:filter.add-filter")}
      </button>
    </div>
  );
};
