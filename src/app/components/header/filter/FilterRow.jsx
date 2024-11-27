import { t } from "i18next";
import f from "lodash/fp";
import { match, otherwise, when } from "match-iz";
import React from "react";
import { translate } from "react-i18next";
import Select from "react-select";
import { ColumnKinds } from "../../../constants/TableauxConstants";
import { getColumnDisplayName } from "../../../helpers/multiLanguage";
import RowFilters from "../../../RowFilters";

const FilterRow = ({ columns, langtag, onChange, onRemove, settings }) => {
  const columnsByName = f.indexBy("name", columns);
  const { column, mode, value } = settings;
  const searchableColumns = columns.filter(col =>
    Boolean(RowFilters.ModesForKind[col.kind])
  );
  const modes = column ? RowFilters.ModesForKind[column.kind] : {};
  const clearFilter = () => onChange({});
  const setColumn = ({ value: name }) => {
    const column = columnsByName[name];
    const mode = Object.values(RowFilters.ModesForKind[column.kind].Mode)[0];
    onChange({
      ...settings,
      column,
      mode,
      value: undefined
    });
  };
  const setMode = md => void onChange({ ...settings, mode: md.value });
  const setValue = val => void onChange({ ...settings, value: val });
  const clearOrRemoveFilter = () => {
    if (!column && (value === undefined || value === "")) onRemove();
    else clearFilter();
  };
  const handleKeys = evt => {
    if (evt.key === "Escape") {
      evt.stopPropagation();
      clearOrRemoveFilter();
    }
  };
  const columnOptions = searchableColumns.map(col => ({
    label: getColumnDisplayName(col, langtag),
    value: col.name
  }));
  const modeOptions = Object.values(modes?.Mode ?? {}).map(md => ({
    label: md,
    value: md
  }));
  const selectedMode = mode || f.first(modeOptions)?.label;

  return (
    <div className="filter-row" onKeyDown={handleKeys}>
      <Select
        className="filter-select"
        options={columnOptions}
        searchable={true}
        clearable={false}
        openOnFocus
        value={column && { label: getColumnDisplayName(column, langtag) }}
        onChange={setColumn ?? f.noop}
        placeholder={t("filter:input.filter")}
        noResultsText={t("input.noResult")}
      />

      <Select
        disabled={!column}
        className="filter-select"
        options={modeOptions}
        searchable={false}
        clearable={false}
        value={selectedMode}
        onChange={setMode}
      />

      <ValueInput
        column={column}
        mode={selectedMode}
        value={value}
        onChange={column?.kind === ColumnKinds.boolean ? setMode : setValue}
      />

      <button
        className="button button--remove-filter"
        onClick={clearOrRemoveFilter}
      >
        <i className="fa fa-trash" />
      </button>
    </div>
  );
};

const ValueInput = ({ column, mode, value, onChange }) => {
  const inputType = match(column?.kind)(
    when(ColumnKinds.date, "date"),
    when(ColumnKinds.datetime, "datetime-local"),
    otherwise("text")
  );
  const disabled = !column || !mode;
  const filterMode = RowFilters.ModesForKind[(column?.kind)];
  const handleSetEventValue = evt =>
    void onChange(filterMode?.readValue(evt.target.value));
  return RowFilters.needsFilterValue(column?.kind, mode) ? (
    <input
      className="filter-input"
      type={inputType}
      value={value || ""}
      onChange={handleSetEventValue}
      disabled={disabled}
    />
  ) : (
    <div className="placeholder" />
  );
};

export default translate(["table", "filter"])(FilterRow);
