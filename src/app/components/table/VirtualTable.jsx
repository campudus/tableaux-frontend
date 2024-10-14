/**
 * On many places it is necessary to add or subtract 1 to column/row index, to combine table contents
 * with header row & meta cell column while fitting everything into react-virtualized's MultiGrid
 * cell position indices.
 */

import f from "lodash/fp";
import PropTypes from "prop-types";
import React, { createRef, PureComponent } from "react";
import { AutoSizer } from "react-virtualized";
import {
  ColumnKinds,
  Directions,
  Langtags,
  RowIdColumn
} from "../../constants/TableauxConstants";
import { canUserCreateRow } from "../../helpers/accessManagementHelper";
import { isLocked } from "../../helpers/annotationHelper";
import { doto, either, mapIndexed, maybe } from "../../helpers/functools";
import getDisplayValue from "../../helpers/getDisplayValue";
import KeyboardShortcutsHelper from "../../helpers/KeyboardShortcutsHelper";
import { saveColumnWidths } from "../../helpers/localStorage";
import actions from "../../redux/actionCreators";
import store from "../../redux/store";
import Cell, { getAnnotationState } from "../cells/Cell";
import MetaCell from "../cells/MetaCell";
import MetaCellHeader from "../cells/MetaCellHeader";
import ColumnHeader from "../columns/ColumnHeader";
import AddNewRowButton from "../rows/NewRow";
import MultiGrid from "./GrudGrid";
import * as tableNavigationWorker from "./tableNavigationWorker";

const META_CELL_WIDTH = 80;
const STATUS_CELL_WIDTH = 120;
const HEADER_HEIGHT = 37;
const CELL_WIDTH = 300;
const ROW_HEIGHT = 45;

const safelyPassIndex = x => (f.isNumber(x) && !f.isNaN(x) ? x : -1);

export default class VirtualTable extends PureComponent {
  constructor(props) {
    super(props);
    this.virtualTableRef = createRef();
    this.keyboardRecentlyUsedTimer = null;
    this.state = {
      openAnnotations: {},
      newRowAdded: false,
      showResizeBar: false,
      columnWidths: {}
    };
  }

  colWidths = new Map([[0, META_CELL_WIDTH]]);
  columnStartSize = null;

  getStoredView = () =>
    either(localStorage)
      .map(f.get("tableViews"))
      .map(JSON.parse)
      .map(f.get([this.props.table.id, "default"]))
      .getOrElse({});

  componentWillMount() {
    const view = this.getStoredView();
    this.setState({ columnWidths: view.columnWidths || {} });
  }

  focusTable = () => {
    if (document.activeElement !== this.virtualTableRef.current) {
      requestAnimationFrame(() => this.virtualTableRef.current?.focus());
    }
  };

  setBarOffset = event => {
    this.divRef.style.left = event.clientX + "px";
  };

  getSelectedCell = () =>
    f.propOr({}, "selectedCell.selectedCell", store.getState());

  handleScroll = f.debounce(100, () => {
    if (document.activeElement === document.body) {
      this.focusTable();
    }
  });

  saveColWidths = index => {
    this.columnStartSize = null;
    if (index === this.getFixedColumnCount() - 1) {
      window.removeEventListener("mousemove", this.setBarOffset);
      this.setState({ showResizeBar: false });
    }
    if (!localStorage) {
      return;
    }
    const storageKey = this.props.table.id.toString();
    const { columnWidths = {} } = this.state;

    saveColumnWidths(storageKey, columnWidths);
    store.dispatch(actions.rerenderTable());
  };

  calcRowHeight = ({ index }) => {
    if (index === 0) {
      return HEADER_HEIGHT;
    }
    const row = f.get([index - 1], this.props.rows);
    const rowId = f.get("id", row);
    return f.contains(rowId, this.props.expandedRowIds)
      ? f.size(Langtags) * ROW_HEIGHT
      : ROW_HEIGHT;
  };

  calcColWidth = ({ index }) => {
    const { hasStatusColumn } = this.props;
    const widths = this.state.columnWidths || {};
    return index === 0
      ? META_CELL_WIDTH
      : hasStatusColumn && index === 1
      ? STATUS_CELL_WIDTH
      : widths[index] || CELL_WIDTH;
  };

  moveResizeBar = () => {
    this.setState({ showResizeBar: true });
    window.addEventListener("mousemove", this.setBarOffset);
  };

  updateColWidth = (index, dx) => {
    if (!this.columnStartSize) {
      this.columnStartSize = this.calcColWidth({ index });
    }
    const newWidth = Math.max(100, this.columnStartSize + dx);
    this.setState(f.update("columnWidths", f.assoc(index, newWidth)));
    maybe(this.multiGrid)
      .method("recomputeGridSize", { columnIndex: index })
      .method("invalidateCellSizeAfterRender");
  };

  setOpenAnnotations = cell => {
    if (f.isNil(cell) && !f.isEmpty(this.state.openAnnotations)) {
      this.setState({ openAnnotations: {} });
    } else if (!f.isNil(cell)) {
      this.setState({ openAnnotations: { cellId: cell.id } });
    }
  };

  openCellContextMenu = this.props.openCellContextMenu(this.setOpenAnnotations);

  renderEmptyTable = () => {
    return null;
  };

  cellRenderer = gridData => {
    return (
      <div style={gridData.style} key={gridData.key}>
        {this.renderGridCell(gridData)}
      </div>
    );
  };

  renderGridCell = gridData => {
    // if we're below all rows, render buttons
    if (gridData.rowIndex > f.size(this.props.rows)) {
      return this.renderButton(gridData);
    }

    // if we're in the first column, render meta cells
    if (gridData.columnIndex === 0) {
      return this.renderMetaCell({
        ...gridData,
        key: `cell-${gridData.key}`,
        rowIndex: gridData.rowIndex - 1
      });
    }

    return gridData.rowIndex === 0
      ? this.renderColumnHeader({
          ...gridData,
          key: `cell-${gridData.key}`,
          columnIndex: gridData.columnIndex - 1
        })
      : this.renderCell({
          ...gridData,
          key: `cell-${gridData.key}`,
          rowIndex: gridData.rowIndex - 1,
          columnIndex: gridData.columnIndex - 1
        });
  };

  getFixedColumnCount = () => {
    const { visibleColumnOrdering, hasStatusColumn } = this.props;
    const columnCount = f.size(visibleColumnOrdering) + 1;
    return columnCount < 3 ? 0 : f.min([columnCount, hasStatusColumn ? 3 : 2]);
  };

  renderColumnHeader = ({ columnIndex }) => {
    const column = this.getVisibleElement(this.props.columns, columnIndex);
    const { table, tables, actions, navigate } = this.props;
    return (
      <ColumnHeader
        column={column}
        langtag={this.props.langtag}
        tables={tables}
        tableId={table.id}
        resizeIdHandler={this.moveResizeBar}
        resizeHandler={this.updateColWidth}
        resizeFinishedHandler={this.saveColWidths}
        index={columnIndex + 1}
        width={this.calcColWidth({ index: columnIndex + 1 })}
        actions={actions}
        navigate={navigate}
        fixedColumnCount={this.getFixedColumnCount()}
      />
    );
  };

  renderMetaCell = ({ rowIndex, key }) => {
    if (rowIndex < 0) {
      return (
        <MetaCellHeader key="id-cell" displayName="ID" column={RowIdColumn} />
      );
    }

    const {
      actions,
      actions: { deleteRow },
      langtag,
      rows,
      expandedRowIds,
      table
    } = this.props;
    const row = rows[rowIndex] || {};
    const isRowExpanded = f.contains(row.id, expandedRowIds);
    const locked = isLocked(row);
    const toggleExpandedRow = rowId => () =>
      actions.toggleExpandedRow({ rowId });

    return isRowExpanded ? (
      <div className="cell-stack">
        {Langtags.map(lt => (
          <MetaCell
            toggleExpandedRow={toggleExpandedRow(row.id)}
            key={`${key}-${lt}`}
            langtag={lt}
            expanded={true}
            row={row}
            isLocked={locked}
            table={table}
            deleteRow={deleteRow}
          />
        ))}
      </div>
    ) : (
      <MetaCell
        toggleExpandedRow={toggleExpandedRow(row.id)}
        key={`${key}-${row.id}`}
        langtag={langtag}
        row={row}
        expanded={false}
        isLocked={locked}
        table={table}
        deleteRow={deleteRow}
      />
    );
  };

  renderCell = gridData => {
    const { rows, expandedRowIds } = this.props;
    const { rowIndex } = gridData;
    const row = rows[rowIndex];
    return f.contains(row.id, expandedRowIds)
      ? this.renderExpandedRowCell(gridData)
      : this.renderSingleCell(gridData);
  };

  renderSingleCell = ({ columnIndex, rowIndex, style }) => {
    const { actions, langtag, columns, tableView } = this.props;
    const { openAnnotations } = this.state;
    const cell = this.getCell(rowIndex, columnIndex);
    const { value } = cell;
    const { width } = style;

    const annotationState = getAnnotationState(cell);
    return (
      <Cell
        actions={actions}
        allDisplayValues={tableView.displayValues}
        annotationState={annotationState}
        annotationsOpen={
          !!openAnnotations.cellId && openAnnotations.cellId === cell.id
        }
        cell={cell}
        closeCellContextMenu={this.props.closeCellContextMenu}
        columns={columns}
        displayValue={cell.displayValue}
        focusTable={this.focusTable}
        isExpandedCell={false}
        langtag={langtag}
        openCellContextMenu={this.openCellContextMenu}
        rowIndex={rowIndex}
        rows={this.props.rows}
        selectedCell={this.getSelectedCell()}
        toggleAnnotationPopup={this.setOpenAnnotations}
        value={value}
        visibleColumns={this.props.visibleColumnOrdering}
        width={width}
      />
    );
  };

  renderExpandedRowCell = ({ columnIndex, rowIndex, key, style }) => {
    const { actions, columns, tableView, langtag: userLangtag } = this.props;
    const { openAnnotations } = this.state;
    const column = this.getVisibleElement(columns, columnIndex);
    const cell = this.getCell(rowIndex, columnIndex);
    const annotationsState = getAnnotationState(cell);
    const { width } = style;

    return (
      <div className="cell-stack">
        {Langtags.map((langtag, idx) => {
          const isPrimaryLang = langtag === f.first(Langtags);
          const displayValue = this.getDisplayValueWithFallback(
            rowIndex,
            columnIndex,
            column,
            cell.value
          );

          const style = { position: "absolute", top: `${idx * ROW_HEIGHT}px` };

          return (
            <Cell
              actions={actions}
              allDisplayValues={tableView.displayValues}
              annotationState={annotationsState}
              annotationsOpen={
                isPrimaryLang &&
                !!openAnnotations.cellId &&
                cell.id === openAnnotations.cellId
              }
              cell={cell}
              closeCellContextMenu={this.props.closeCellContextMenu}
              column={column}
              displayValue={displayValue}
              focusTable={this.focusTable}
              isExpandedCell={!isPrimaryLang}
              key={`${userLangtag}-${langtag}-${key}`}
              langtag={langtag}
              openCellContextMenu={this.openCellContextMenu}
              rows={this.props.rows}
              selectedCell={this.getSelectedCell()}
              toggleAnnotationPopup={this.setOpenAnnotations}
              value={cell.value}
              visibleColumns={this.props.visibleColumnOrdering}
              width={width}
              style={style}
            />
          );
        })}
      </div>
    );
  };

  renderButton = ({ columnIndex }) => {
    const {
      table: { id, type },
      table,
      actions: { addEmptyRow, showToast, toggleCellSelection },
      rows,
      columns,
      langtag
    } = this.props;
    const hasStatusColumn = columns.find(c => c.kind === ColumnKinds.status);
    const rowButtonColumn = hasStatusColumn ? 2 : 1;
    if (
      type !== "settings" &&
      columnIndex === rowButtonColumn &&
      canUserCreateRow({ table })
    ) {
      return (
        <AddNewRowButton
          onAdd={async () => {
            const { result: newRow } = await addEmptyRow(id);
            toggleCellSelection({
              langtag,
              tableId: id,
              rowId: newRow.id
            });
            this.forceUpdate();
          }}
          rows={rows}
          showToast={showToast}
        />
      );
    }
    return (
      <div
        style={{
          height: "100%",
          width: "100%",
          backgroundColor: "white"
        }}
      />
    );
  };

  getCell = (rowIndex, columnIndex) => {
    try {
      const { rows, table } = this.props;
      const values = rows[rowIndex].values;
      const cells = rows[rowIndex].cells;
      const value = this.getVisibleElement(values, columnIndex);
      const cell = this.getVisibleElement(cells, columnIndex);
      return {
        ...cell,
        value,
        row: rows[rowIndex],
        displayValue: this.getDisplayValueWithFallback(
          rowIndex,
          columnIndex,
          cell.column,
          value
        ),
        isReadOnly:
          table.type === "settings" &&
          f.contains(cell.column.id, this.settingsColumnIds)
      };
    } catch (err) {
      console.error(
        `Could not get cell ${rowIndex}, ${columnIndex}`,
        this.props.rows[rowIndex],
        err
      );
    }
  };

  getDisplayValueWithFallback = (rowIndex, columnIndex, column, value) =>
    this.getVisibleElement(
      f.propOr([], rowIndex, this.props.displayValues),
      columnIndex
    ) || getDisplayValue(column, value);

  filterVisibleCells = (cell, columnIdx) =>
    columnIdx === 0 || f.get("visible", this.props.columns[columnIdx]);

  getVisibleElement = (elements, idx) =>
    elements[this.props.visibleColumnOrdering[idx]];

  componentWillReceiveProps(next) {
    const newPropKeys = f.keys(next);
    const changeInRowSelection =
      f.contains("expandedRowIds", newPropKeys) &&
      !f.isEmpty(f.xor(next.expandedRowIds, this.props.expandedRowIds));

    if (changeInRowSelection) {
      maybe(this.multiGrid).method("invalidateCellSizeAfterRender");
    }
    if (this.props.rerenderTable !== next.rerenderTable) {
      const view = this.getStoredView();
      this.setState({ columnWidths: view.columnWidths || {} });
      maybe(this.multiGrid).method("invalidateCellSizeAfterRender");
    }
  }

  getScrollInfo = () => {
    const { rows, columns, visibleColumnOrdering } = this.props;
    const { rowId, columnId, align } = this.getSelectedCell();

    const rowIndex = f.findIndex(f.matchesProperty("id", rowId), rows);
    const columnIndex = f.compose(
      f.get("orderIdx"),
      f.find(({ id }) => id === columnId),
      mapIndexed((obj, orderIdx) => ({ ...obj, orderIdx })),
      f.map(index => ({ id: f.get("id", columns[index]), idx: index }))
    )(visibleColumnOrdering);

    return {
      columnIndex: columnIndex + 1,
      rowIndex: rowIndex + 1,
      align
    };
  };

  storeGridElement = node => {
    this.multiGrid = node;
  };

  componentDidMount() {
    // Switching tables will remount virtual table
    this.settingsColumnIds = doto(this.props.columns, f.take(2), f.map("id"));
    this.divRef = document.getElementById("resize-bar");
    this.focusTable();
  }

  componentDidUpdate(prev) {
    // jump one row down if a new one was created from keyboardnavigation
    if (this.state.newRowAdded && f.size(prev.rows) < f.size(this.props.rows)) {
      tableNavigationWorker.setNextSelectedCell.call(this, Directions.DOWN);

      this.setState({
        ...this.state,
        newRowAdded: false
      });
    }
    this.focusTable();
  }

  divRef = null;

  render() {
    const {
      rows,
      expandedRowIds,
      columns,
      langtag,
      visibleColumnOrdering
    } = this.props;
    const columnKeys = visibleColumnOrdering.join(",");
    const { openAnnotations, showResizeBar } = this.state;
    const { rowIndex, columnIndex, align } = this.getScrollInfo();

    const columnCount = f.size(visibleColumnOrdering) + 1;
    const rowCount = f.size(rows) + 2; // one for headers, one for button line

    const resizeBarClass = showResizeBar
      ? "resize-bar"
      : "resize-bar-invisible";

    const shouldIDColBeGrey =
      f.get("kind", columns[0] /*columns.first()*/) === ColumnKinds.concat &&
      rowCount * 45 + 37 > window.innerHeight; // table might scroll (data rows + button + 37 + tableaux-header) >

    return (
      <section
        id="virtual-table-wrapper"
        ref={this.virtualTableRef}
        tabIndex="-1"
        onKeyDown={KeyboardShortcutsHelper.onKeyboardShortcut(
          tableNavigationWorker.getKeyboardShortcuts.bind(this)
        )}
      >
        <div id="resize-bar" className={resizeBarClass} />
        <AutoSizer>
          {({ height, width }) => {
            return (
              <MultiGrid
                onScroll={this.handleScroll}
                isScrollingOptOut={true}
                enableFixedColumnScroll={true}
                langtag={langtag}
                ref={this.storeGridElement}
                key={columnCount < 3 ? "no-fixed-rows" : "with-fixed-rows"}
                className="data-wrapper"
                cellRenderer={this.cellRenderer}
                columnCount={columnCount}
                columnWidth={this.calcColWidth}
                noContentRenderer={this.renderEmptyTable}
                rowCount={rowCount}
                rowHeight={this.calcRowHeight}
                fixedColumnCount={this.getFixedColumnCount()}
                fixedRowCount={1}
                width={width}
                height={height}
                expandedRows={expandedRowIds}
                openAnnotations={!!openAnnotations && openAnnotations.cellId}
                scrollToRow={safelyPassIndex(rowIndex)}
                scrollToColumn={safelyPassIndex(columnIndex)}
                scrollToAlignment={align}
                columnKeys={columnKeys}
                overscanColumnCount={5}
                overscanRowCount={6}
                classNameBottomRightGrid={"multigrid-bottom-right"}
                classNameTopRightGrid={"multigrid-top-right"}
                classNameBottomLeftGrid={"multigrid-bottom-left"}
                fullyLoaded={this.props.fullyLoaded}
                styleTopRightGrid={{
                  backgroundColor: "#f9f9f9",
                  borderBottom: "3px solid #eee"
                }}
                styleBottomLeftGrid={{
                  backgroundColor: shouldIDColBeGrey ? "#f9f9f9" : "white"
                }}
              />
            );
          }}
        </AutoSizer>
      </section>
    );
  }
}

VirtualTable.propTypes = {
  columns: PropTypes.array.isRequired,
  rows: PropTypes.array.isRequired,
  table: PropTypes.object.isRequired,
  tables: PropTypes.object.isRequired,
  langtag: PropTypes.string.isRequired,
  expandedRowIds: PropTypes.array,
  selectedCell: PropTypes.object,
  selectedCellEditing: PropTypes.bool,
  selectedCellExpandedRow: PropTypes.string,
  visibleColumns: PropTypes.string.isRequired
};
