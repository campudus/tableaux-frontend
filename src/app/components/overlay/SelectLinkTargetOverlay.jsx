import i18n from "i18next";
import f from "lodash/fp";
import React, { useCallback, useState } from "react";
import { AutoSizer, List } from "react-virtualized";
import { buildClassName } from "../../helpers/buildClassName";
import { unless } from "../../helpers/functools";
import {
  getTableDisplayName,
  retrieveTranslation
} from "../../helpers/multiLanguage";
import { createTextFilter } from "../../helpers/searchFunctions";
import * as t from "../../helpers/transduce";
import actions from "../../redux/actionCreators";
import store from "../../redux/store";
import SearchBar from "../cells/link/LinkOverlaySearchBar";
import Empty from "../helperComponents/emptyEntry";
import SvgIcon from "../helperComponents/SvgIcon";
import Header from "./Header";
import { addEmptyRow } from "../../redux/actions/rowActions";
import { openEntityView } from "./EntityViewOverlay";
import { SwitchSortingButton } from "../cells/link/LinkOverlayFragments";
import OverlayHeadRowIdentificator from "../overlay/OverlayHeadRowIdentificator";
import { isTaxonomyTable } from "../taxonomy/taxonomy";
import TaxonomySelectLinkTargetOverlay from "../taxonomy/TaxonomySelectLinkTargetOverlay";
import getDisplayValue from "../../helpers/getDisplayValue";

const ListItem = ({ isLinked, item, onChange, onEdit, style, langtag }) => {
  const displayValue = unless(
    f.isString,
    retrieveTranslation(langtag),
    item.displayValue
  ) || <Empty langtag={langtag} />;

  return (
    <div style={style} className="list-item-container">
      <div className="list-item">
        <div
          className="linkButton roundCorners"
          onClick={() => onChange(isLinked ? undefined : item.id)}
        >
          <SvgIcon
            icon={isLinked ? "minus" : "plus"}
            containerClasses="color-primary"
          />
        </div>
        <div className="linkButton" onClick={() => onEdit(item.id)}>
          <SvgIcon icon="edit" containerClasses="color-primary" />
        </div>
        <div className="left link-display-value">{displayValue}</div>
      </div>
    </div>
  );
};

const renderListItem = ({ items, onChange, onEdit, langtag }) => ({
  index,
  style
}) => {
  const item = items[index] || {};
  return (
    <ListItem
      key={item.id}
      item={item}
      style={style}
      onChange={onChange}
      onEdit={onEdit}
      langtag={langtag}
    />
  );
};

const handleCreateRow = ({ table, langtag, onCreateRow }) => async () => {
  const newRow = await store
    .dispatch(addEmptyRow(table.id))
    .then(f.prop("result"));
  onCreateRow(newRow.id);
  openEntityView({ langtag, row: newRow, table });
};

const RowCreator = ({
  noRowsAvailable,
  table,
  onClick,
  langtag
}) => {
  const cssClass = buildClassName("row-creator", {
    "no-rows-available": noRowsAvailable
  });
  const tableName = getTableDisplayName(table, langtag);

  return (
    <div onClick={onClick} className={cssClass}>
      <SvgIcon icon="plus" containerClasses="color-primary" />
      <span>{i18n.t("table:link-overlay-add-new-row", { tableName })}</span>
    </div>
  );
};

const translateDisplayValue = langtag => dv =>
  Array.isArray(dv)
    ? f.flatMap(translateDisplayValue(langtag), dv)
    : retrieveTranslation(langtag, dv);

const getFlatDisplayValue = langtag =>
  f.compose(
    translateDisplayValue(langtag),
    f.first
  );

const keyValuesById = (accum, next) => {
  accum[next.id] = next.values;
  return accum;
};

const removeStaleRows = (tableId, grudData) => rows => {
  // While deleted rows get cleared from redux states, display value cache is
  // read-only (important for performance on big datasets).
  // As we build the selectable rows from display values for reasons of
  // performance and simplicity, we need to consider that fact.
  const ids = new Set();
  f.prop(["rows", tableId, "data"], grudData).forEach(row => ids.add(row.id));
  return rows.filter(row => ids.has(row.id));
};

const extractDisplayValues = (langtag, tableId, grudData) =>
  f.compose(
    f.reduce(keyValuesById, {}),
    f.map(f.update("values", getFlatDisplayValue(langtag))),
    removeStaleRows(tableId, grudData),
    f.propOr([], ["displayValues", tableId])
  )(grudData);

const mkResultFilter = (mode, value) => {
  const matchesFilter = createTextFilter(mode, value);
  return item => matchesFilter(item[1]); // this is performed before entries are transformed to dicts
};

const CardinalityInfo = ({ max, n }) => {
  const [prefix, middle, suffix] = i18n
    .t("table:link-overlay-count")
    .split("|");
  return max > 0 ? (
    <div className="cardinality-info">
      <span className="cardinality-info__text">{prefix}</span>
      <span className="cardinality-info__count">{n}</span>
      <span className="cardinality-info__text">{middle}</span>
      <span className="cardinality-info__count">{max}</span>
      <span className="cardinality-info__text">{suffix}</span>
    </div>
  ) : null;
};

const SelectLinkTargetOverlay = props => {
  const {
    oldRowId,
    tableId,
    onSubmit,
    langtag,
    grudData,
    sharedData,
    initialTargetRowId
  } = props;
  const [selectedRowId, setSelectedRowId] = useState(initialTargetRowId);
  const displayValueTable = extractDisplayValues(langtag, tableId, grudData);
  const table = f.propOr({}, ["tables", "data", tableId], grudData);

  const filterRows = useCallback(
    mkResultFilter(sharedData.filterMode, sharedData.filterValue),
    [sharedData.filterMode, sharedData.filterValue]
  );

  const itemOrder = sharedData.sorting || f.first(SortMode);

  const availableRows = t
    .transduceList(
      t.filter(filterRows),
      t.map(([id, displayValue]) => ({ id: parseInt(id), displayValue })),
      t.reject(({ id }) => id === oldRowId),
      t.reject(({ id }) => id === selectedRowId),
      t.reject(({ id }) => f.isNil(id))
    )(Object.entries(displayValueTable))
    .sort(itemOrder.fn);

  const handleSelectRowId = useCallback(
    rowId => {
      setSelectedRowId(rowId);
      onSubmit(rowId);
    },
    [tableId]
  );

  const handleOpenEntityView = useCallback(
    rowId => {
      const row = f.compose(
        f.find(f.propEq("id", rowId)),
        f.prop(["rows", tableId, "data"])
      )(grudData);
      openEntityView({ row, langtag, table });
    },
    [grudData]
  );

  const rowRenderer = renderListItem({
    items: availableRows,
    onChange: handleSelectRowId,
    langtag,
    onEdit: handleOpenEntityView
  });

  const onCreateRow = useCallback(
    handleCreateRow({ table, langtag, onCreateRow: handleSelectRowId }),
    [table.id, handleSelectRowId]
  );

  const hasLink = f.isNumber(selectedRowId);

  const subheaderClass = buildClassName(
    "select-link-target",
    { "has-link": hasLink },
    "overlay-subheader"
  );

  return (
    <>
      <section className={subheaderClass}>
        <h1 className="overlay-subheader__title">
          {i18n.t("table:select-link-target.title", {
            linkTitle: displayValueTable[oldRowId]
          })}
        </h1>
        <CardinalityInfo max={1} n={hasLink ? 1 : 0} />

        {hasLink ? (
          <div className="sortable selected-link">
            <ListItem
              isLinked={true}
              onChange={handleSelectRowId}
              item={{
                id: selectedRowId,
                displayValue: displayValueTable[selectedRowId]
              }}
              onEdit={handleOpenEntityView}
            />
          </div>
        ) : null}
      </section>
      <section className="select-link-target overlay-main-content">
        {hasLink ? null : (
          <AutoSizer>
            {({ height, width }) => (
              <List
                className="items-virtualized-list sortable" // "sortable" will just style link items properly
                width={width}
                height={height}
                rowCount={availableRows.length}
                rowHeight={42}
                rowRenderer={rowRenderer}
              />
            )}
          </AutoSizer>
        )}
        <RowCreator
          langtag={langtag}
          onClick={onCreateRow}
          table={table}
          noRowsAvailable={availableRows?.length === 0}
        />
      </section>
    </>
  );
};

const SortMode = [
  {
    name: "by-id-asc",
    fn: (itemA, itemB) => itemA.id - itemB.id,
    icon: "fa fa-sort-numeric-asc"
  },
  {
    name: "by-label-asc",
    fn: (itemA, itemB) =>
      itemA.displayValue < itemB.displayValue
        ? -1
        : itemA.displayValue > itemB.displayValue
        ? 1
        : 0,
    icon: "fa fa-sort-alpha-asc"
  }
];

const SelectLinkTargetOverlayHeader = props => {
  const { id, langtag, updateSharedData, sharedData } = props;
  const setFilterValue = value =>
    updateSharedData(f.assoc("filterValue", value));
  const setFilterMode = mode => updateSharedData(f.assoc("filterMode", mode));
  const chooseNextSorting = idx => {
    const sortMode = SortMode[idx];
    updateSharedData(f.assoc("sorting", sortMode));
  };
  const currentSortIndex = f.clamp(
    0,
    f.size(SortMode),
    SortMode.findIndex(mode => mode === sharedData.sorting)
  );
  const sortIcons = f.map("icon", SortMode);

  return (
    <Header
      {...props}
      context={i18n.t("table:select-link-target.context")}
      title={<OverlayHeadRowIdentificator {...props} />}
    >
      <SearchBar
        id={id}
        langtag={langtag}
        filterMode={sharedData.filterMode}
        filterValue={sharedData.filterValue}
        setFilterMode={setFilterMode}
        setFilterValue={setFilterValue}
        updateSharedData={f.noop}
      />
      <SwitchSortingButton
        setSortOrder={chooseNextSorting}
        sortOrder={currentSortIndex}
        sortIcons={sortIcons}
      />
    </Header>
  );
};

export const openSelectLinkTargetOverlay = ({
  row,
  table,
  langtag,
  onSubmit,
  selectedTargetRowId // optional, when re-selecting
}) => {
  const cell = { ...row.cells[0], value: row.values[0] };
  const hasTableTypeTaxonomy = isTaxonomyTable(cell.table);

  const Head = hasTableTypeTaxonomy
    ? TaxonomySelectLinkTargetOverlay.Head
    : SelectLinkTargetOverlayHeader;
  const Body = hasTableTypeTaxonomy
    ? TaxonomySelectLinkTargetOverlay.Body
    : SelectLinkTargetOverlay;

  const cssClass = buildClassName("select-link-target-overlay", {
    taxonomy: hasTableTypeTaxonomy
  });

  store.dispatch(
    actions.openOverlay({
      head: (
        <Head
          title={retrieveTranslation(
            langtag,
            getDisplayValue(cell.column, cell.value)
          )}
          cell={cell}
          langtag={langtag}
          context={i18n.t("table:select-link-target.context")}
        />
      ),
      body: (
        <Body
          oldRowId={row.id}
          tableId={table.id}
          onSubmit={onSubmit}
          langtag={langtag}
          initialTargetRowId={selectedTargetRowId}
        />
      ),
      type: "full-height",
      classes: cssClass
    })
  );
};

SelectLinkTargetOverlay.displayName = "SelectLinkTargetOverlay";
export default SelectLinkTargetOverlay;
