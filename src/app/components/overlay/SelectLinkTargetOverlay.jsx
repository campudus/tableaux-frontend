import i18n from "i18next";
import f from "lodash/fp";
import React, { useCallback, useMemo, useState } from "react";
import { List } from "react-virtualized";
import { time, unless } from "../../helpers/functools";
import { retrieveTranslation } from "../../helpers/multiLanguage";
import * as t from "../../helpers/transduce";
import actions from "../../redux/actionCreators";
import store from "../../redux/store";
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
    <div key={item.id} style={style} className="list-item-container">
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
        <div className="left">{displayValue}</div>
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

const SelectLinkTargetOverlay = props => {
  const { oldRowId, tableId, onSubmit, langtag, grudData } = props;
  const [selectedRowId, setSelectedRowId] = useState();
  const displayValueTable = time(
    "Extract display values",
    extractDisplayValues
  )(langtag, tableId, grudData);

  const availableRows = t.transduceList(
    t.reject(([id]) => id === oldRowId),
    t.reject(([id]) => id === selectedRowId),
    t.reject(([id]) => f.isNil(id)),
    t.map(([id, displayValue]) => ({ id, displayValue }))
  )(Object.entries(displayValueTable));

  const handleSelectRowId = useCallback(
    rowId => {
      setSelectedRowId(rowId);
      onSubmit(rowId);
    },
    [tableId]
  );

  const rowRenderer = useMemo(
    () =>
      renderListItem({
        items: availableRows,
        onChange: handleSelectRowId,
        langtag
      }),
    [tableId]
  );

  const ROW_HEIGHT = 42;

  return (
    <>
      <section className="select-link-target overlay-subheader">
        <h1 className="overlay-subheader__title">
          {i18n.t("tables:select-link-target.title", {
            linkTitle: displayValueTable[oldRowId]
          })}
        </h1>
        {!f.isNil(selectedRowId) ? (
          <ListItem
            isLinked={true}
            onChange={handleSelectRowId}
            item={{
              id: selectedRowId,
              displayValue: displayValueTable[selectedRowId]
            }}
          />
        ) : (
          <div className="overlay-subheader__text">
            {i18n.t("table:select-link-target:nothing-selected")}
          </div>
        )}
      </section>
      <section className="overlay-main-content">
        <List
          width={window.innerWidth * 0.6 - 100}
          height={f.min([availableRows.length * ROW_HEIGHT, 600])}
          rowCount={availableRows.length}
          rowHeight={42}
          rowRenderer={rowRenderer}
        />
      </section>
    </>
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
      head: <Header context={i18n.t("table:select-link-target")} title={""} />,
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
