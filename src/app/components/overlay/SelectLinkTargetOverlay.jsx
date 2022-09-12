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

type RowCreatorProps = {
  tableName: string,
  noRowsAvailable: boolean,
  onClick: () => void
};
const RowCreator = ({
  noRowsAvailable,
  table,
  onClick,
  langtag
}: RowCreatorProps) => {
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

const getFlatDisplayValue = langtag =>
  f.compose(
    f.join(" "),
    f.compact,
    f.map(val => (f.isNil(val) ? "" : retrieveTranslation(langtag, val)))
  );

const keyValuesById = (accum, next) => {
  accum[next.id] = next.values;
  return accum;
};

const extractDisplayValues = (langtag, tableId, grudData) =>
  f.compose(
    f.reduce(keyValuesById, {}),
    f.map(f.update("values", getFlatDisplayValue(langtag))),
    f.propOr([], ["displayValues", tableId])
  )(grudData);

const mkResultFilter = (mode, value) => {
  const matchesFilter = createTextFilter(mode, value);
  return item => matchesFilter(item[1]); // this is performed before entries are transformed to dicts
};

const SelectLinkTargetOverlay = props => {
  const { oldRowId, tableId, onSubmit, langtag, grudData, sharedData } = props;
  const [selectedRowId, setSelectedRowId] = useState();
  const displayValueTable = extractDisplayValues(langtag, tableId, grudData);
  const table = f.propOr({}, ["tables", "data", tableId], grudData);

  const filterRows = useCallback(
    mkResultFilter(sharedData.filterMode, sharedData.filterValue),
    [sharedData.filterMode, sharedData.filterValue]
  );

  const availableRows = t.transduceList(
    t.reject(([id]) => id === oldRowId),
    t.reject(([id]) => id === selectedRowId),
    t.reject(([id]) => f.isNil(id)),
    t.filter(filterRows),
    t.map(([id, displayValue]) => ({ id, displayValue }))
  )(Object.entries(displayValueTable));

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
        f.find(f.propEq("id", parseInt(rowId))),
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

  return (
    <>
      <section className="select-link-target overlay-subheader">
        <h1 className="overlay-subheader__title">
          {i18n.t("tables:select-link-target.title", {
            linkTitle: displayValueTable[oldRowId]
          })}
        </h1>
        {!f.isNil(selectedRowId) ? (
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
        ) : (
          <div className="overlay-subheader__description">
            {i18n.t("table:select-link-target:nothing-selected")}
          </div>
        )}
      </section>
      <section className="select-link-target overlay-main-content">
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

const SelectLinkTargetOverlayHeader = props => {
  const { id, langtag, updateSharedData, sharedData } = props;
  const setFilterValue = value =>
    updateSharedData(f.assoc("filterValue", value));
  const setFilterMode = mode => updateSharedData(f.assoc("filterMode", mode));
  return (
    <Header
      {...props}
      context={i18n.t("table:select-link-target.context")}
      title={""}
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
    </Header>
  );
};

export const openSelectLinkTargetOverlay = ({
  row,
  table,
  langtag,
  onSubmit
}) => {
  store.dispatch(
    actions.openOverlay({
      head: <SelectLinkTargetOverlayHeader />,
      body: (
        <SelectLinkTargetOverlay
          oldRowId={row.id}
          tableId={table.id}
          onSubmit={onSubmit}
          langtag={langtag}
        />
      ),
      type: "full-height",
      classes: "select-link-target-overlay"
    })
  );
};

SelectLinkTargetOverlay.displayName = "SelectLinkTargetOverlay";
export default SelectLinkTargetOverlay;
