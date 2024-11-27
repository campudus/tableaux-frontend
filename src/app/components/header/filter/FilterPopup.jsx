import i18n from "i18next";
import f from "lodash/fp";
import PropTypes from "prop-types";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { translate } from "react-i18next";
import { useSelector } from "react-redux";
import Select from "react-select";
import TableauxConstants from "../../../constants/TableauxConstants";
import { outsideClickEffect } from "../../../helpers/useOutsideClick";
import RowFilters from "../../../RowFilters";
import FilterPopupFooter from "./FilterPopupFooter";
import FilterRow from "./FilterRow";
import FilterSavingPopup from "./FilterSavingPopup";
import {
  fromCombinedFilter,
  mkAnnotationFilterTemplates,
  toCombinedFilter
} from "./helpers";
import { match, when, otherwise } from "match-iz";
import { RestoreSavedFiltersArea } from "./FilterSavingPopup";
import * as Storage from "../../../helpers/localStorage";

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
  const settingsAreValid = filterList.length > 0;

  const handleSubmit = () => {
    actions.toggleCellSelection({ select: false, langtag, tableId });
    actions.setFiltersAndSorting(filterList, [], true);
  };
  const handleClearFilters = () => {
    setRowFilters([{}]);
    setAnnotationFilters({});
    actions.setFiltersAndSorting([], [], true);
  };
  return (
    <div className="filter-popup" ref={containerRef}>
      <section className="filter-popup__content-section">
        <header className="filter-popup__header">
          <div className="filter-popup__heading">
            {i18n.t("table:filter.filters")}
          </div>
          <button
            className="button button--open-save-overlay"
            onClick={() => setShowFilterSavePopup(true)}
            disabled={!settingsAreValid}
          >
            Save
          </button>
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
      {
        <RestoreSavedFiltersArea
          columns={columns}
          onClear={handleClearUserFilter}
          onSubmit={handleSetFromUserFilter}
          storedFilters={userFilters}
        />
      }
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

export default TheFilterPopup;

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
