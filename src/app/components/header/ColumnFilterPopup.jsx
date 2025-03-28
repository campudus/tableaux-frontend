import classNames from "classnames";
import i18n from "i18next";
import f from "lodash/fp";
import PropTypes from "prop-types";
import React, { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { FilterModes } from "../../constants/TableauxConstants";
import { findGroupMemberIds } from "../../helpers/columnHelper";
import { getColumnDisplayName } from "../../helpers/multiLanguage";
import SearchFunctions from "../../helpers/searchFunctions";
import { outsideClickEffect } from "../../helpers/useOutsideClick";
import actions from "../../redux/actionCreators";
import DragSortList from "../cells/link/DragSortList";

export const countHiddenColumns = columns => {
  const groupMemberIds = findGroupMemberIds(columns);
  return columns.filter(
    column => !groupMemberIds.has(column.id) && !column.visible
  ).length;
};

const ColumnFilterPopup = ({
  columns: rawColumns,
  columnActions,
  close,
  langtag,
  tableId,
  columnOrdering
}) => {
  const allColumns = columnOrdering.map(({ idx }) => rawColumns[idx]);
  const groupMemberIds = findGroupMemberIds(allColumns);
  const idColumn = allColumns[0];
  const dispatch = useDispatch();
  const [search, setSearch] = useState("");
  const handleSetSearch = evt => {
    setSearch(evt.target.value);
  };
  const getFilteredColumns = f.compose(
    f.filter(columnNameMatchesQuery(search, langtag)),
    f.reject(f.where({ id: id => groupMemberIds.has(id) })),
    f.tail
  );

  const containerRef = useRef();
  useEffect(
    outsideClickEffect({
      shouldListen: true,
      containerRef,
      onOutsideClick: close
    }),
    [containerRef.current]
  );

  const columns = getFilteredColumns(allColumns);
  const columnsById = f.indexBy("id", columns);
  const nHidden = countHiddenColumns(allColumns);

  const [selected, setSelected] = useState({
    idx: 0,
    id: idColumn?.id
  });
  const selectColumn = (id, idx) => {
    setSelected({ idx, id });
  };
  const applyColumnOrdering = newOrdering => {
    const mapOrderingToIndices = f.map(colId => ({
      id: colId,
      idx: f.findIndex(({ id }) => id === colId, allColumns)
    }));

    void f.compose(
      columnActions.setColumnOrdering,
      mapOrderingToIndices,
      f.concat(idColumn.id)
    )(newOrdering);
    void dispatch(actions.rerenderTable());
  };

  const renderCheckboxItem = ({ key: id, index, style }) => {
    const column = columnsById[id];
    const name = getColumnDisplayName(column, langtag);
    const isSelected = id === selected.id;
    const cssClass = classNames("column-filter-checkbox-wrapper", {
      even: index % 2 === 0 && !isSelected,
      odd: index % 2 === 1 && !isSelected,
      selected: isSelected
    });
    const buttonClass = classNames("column-filter__to-column-item", {
      "to-column-item--visible": column.visible
    });
    const handleToggleColumnVisibility = () => {
      columnActions.toggleColumnVisibility(column.id);
    };
    const handleFocusColumn = evt => {
      evt.stopPropagation();
      dispatch(
        actions.toggleCellSelection({ columnId: column.id, tableId, langtag })
      );
      dispatch(actions.rerenderTable());
    };
    return (
      <div
        className={cssClass}
        key={id}
        style={style}
        onClick={handleToggleColumnVisibility}
        onMouseEnter={() => selectColumn(column.id, index)}
      >
        <input
          type="checkbox"
          checked={column.visible}
          onChange={f.noop} // to avoid React warning "unmanaged input"
        />
        {name}
        <button className={buttonClass} onClick={handleFocusColumn}>
          {i18n.t("table:go-to-column")}
          <i className="to-column-item__icon fa fa-long-arrow-right" />
        </button>
      </div>
    );
  };

  return (
    <div id="column-filter-popup-wrapper" ref={containerRef}>
      <div className="row infotext header-text">
        <i className="fa fa-eye" />
        {i18n.t("table:hide_unhide")}
      </div>
      <div className="wrap-me-grey">
        <div className="filter-input row">
          <input
            type="text"
            className="input"
            placeholder={i18n.t("table:filter_columns")}
            onChange={handleSetSearch}
            autoFocus
          />
        </div>
      </div>
      {search && f.isEmpty(columns) ? (
        <div className="no-column-search-result">
          {i18n.t("table:no-column-search-result")}
        </div>
      ) : (
        <DragSortList
          {...ListProps}
          wrapperClass="column-checkbox-list"
          renderListItem={renderCheckboxItem}
          onReorder={applyColumnOrdering}
          entries={f.map("id", columns)}
        />
      )}
      <div className="row infotext">
        <span>{nHidden + " " + i18n.t("table:hidden_items")}</span>
      </div>
      <div className="wrap-me-grey">
        <div className="row">
          <button
            className="button positive"
            onClick={() =>
              columnActions.setColumnsVisible(f.map("id", allColumns))
            }
          >
            {i18n.t("table:show_all_columns")}
          </button>
          <button
            className="button neutral"
            onClick={() => columnActions.hideAllColumns(tableId, allColumns)}
          >
            {i18n.t("table:hide_all_columns")}
          </button>
        </div>
      </div>
    </div>
  );
};

const ListProps = ({ rowCount, selectedIndex }) => ({
  className: "column-checkbox-list",
  width: 440,
  height: 300,
  rowCount,
  rowHeight: 30,
  scrollToIndex: selectedIndex,
  style: { overflowX: "hidden" }
});

// (String, Langtag) -> (Column -> Boolean)
const columnNameMatchesQuery = (query, langtag) =>
  f.isEmpty(query)
    ? f.stubTrue
    : column => {
        const displayName = getColumnDisplayName(column, langtag);
        return SearchFunctions[FilterModes.CONTAINS](query, displayName);
      };
ColumnFilterPopup.propTypes = {
  close: PropTypes.func.isRequired,
  columnActions: PropTypes.objectOf(PropTypes.func).isRequired,
  columnOrdering: PropTypes.arrayOf(PropTypes.object).isRequired,
  columns: PropTypes.arrayOf(PropTypes.object).isRequired,
  langtag: PropTypes.string.isRequired,
  tableId: PropTypes.number.isRequired
};

export default ColumnFilterPopup;
