import i18n from "i18next";
import f from "lodash/fp";
import React, { useCallback, useState } from "react";
import { AutoSizer, List } from "react-virtualized";
import { unless } from "../../helpers/functools";
import { retrieveTranslation } from "../../helpers/multiLanguage";
import { createTextFilter } from "../../helpers/searchFunctions";
import * as t from "../../helpers/transduce";
import actions from "../../redux/actionCreators";
import store from "../../redux/store";
import SearchBar from "../cells/link/LinkOverlaySearchBar";
import Empty from "../helperComponents/emptyEntry";
import SvgIcon from "../helperComponents/SvgIcon";
import Header from "./Header";

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

const getFlatDisplayValue = langtag =>
  f.compose(
    f.join(" "),
    f.compact,
    f.map(retrieveTranslation(langtag))
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

  const rowRenderer = renderListItem({
    items: availableRows,
    onChange: handleSelectRowId,
    langtag
  });

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
      type: "full-height"
    })
  );
};

SelectLinkTargetOverlay.displayName = "SelectLinkTargetOverlay";
export default SelectLinkTargetOverlay;
