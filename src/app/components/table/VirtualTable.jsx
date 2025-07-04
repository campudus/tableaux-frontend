/**
 * On many places it is necessary to add or subtract 1 to column/row index, to combine table contents
 * with header row & meta cell column while fitting everything into react-virtualized's MultiGrid
 * cell position indices.
 */

import f from "lodash/fp";
import PropTypes from "prop-types";
import React, { createRef, PureComponent } from "react";
import { Rnd } from "react-rnd";
import { AutoSizer, MultiGrid } from "react-virtualized";
import {
  ColumnKinds,
  Directions,
  Langtags,
  RowIdColumn
} from "../../constants/TableauxConstants";
import { canUserCreateRow } from "../../helpers/accessManagementHelper";
import { isLocked } from "../../helpers/rowUnlock";
import { doto, maybe } from "../../helpers/functools";
import getDisplayValue from "../../helpers/getDisplayValue";
import KeyboardShortcutsHelper from "../../helpers/KeyboardShortcutsHelper";
import actions from "../../redux/actionCreators";
import store from "../../redux/store";
import Cell from "../cells/Cell";
import MetaCell from "../cells/MetaCell";
import ColumnHeader from "../columns/ColumnHeader";
import * as tableNavigationWorker from "./tableNavigationWorker";
import reduxActionHoc from "../../helpers/reduxActionHoc";

const META_CELL_WIDTH = 80;
const STATUS_CELL_WIDTH = 120;
const HEADER_HEIGHT = 37;
const CELL_WIDTH = 300;
const ROW_HEIGHT = 45;

class VirtualTable extends PureComponent {
  constructor(props) {
    super(props);
    this.virtualTableRef = createRef();
    this.keyboardRecentlyUsedTimer = null;
    this.state = {
      openAnnotations: {},
      newRowAdded: false,
      showResizeBar: false,
      columnWidths: {},
      selectedCell: {}
    };
    this.cacheColumnIndices(props.columns);
    this.handleKeyDown = KeyboardShortcutsHelper.onKeyboardShortcut(
      tableNavigationWorker.getKeyboardShortcuts.bind(this)
    );
  }

  colWidths = new Map([[0, META_CELL_WIDTH]]);
  columnStartSize = null;

  componentWillMount() {
    this.setState({ columnWidths: this.props.columnWidths });
  }

  focusTable = () => {
    if (document.activeElement !== this.virtualTableRef.current) {
      requestAnimationFrame(() => this.virtualTableRef.current?.focus());
    }
  };

  setBarOffset = event => {
    this.divRef.style.left = event.clientX + "px";
  };

  focusTableDebounced = f.debounce(100, () => {
    this.focusTable();
  });

  handleScroll = () => {
    if (f.keys(this.state.selectedCell).length > 0) {
      // this is a hack to prevent out of sync scrolling behaviour
      // between fixed columns and main columns.
      // MultiGrid scrolling is only out of sync if scrollToRow or scrolToColumn is set,
      // so we read rowIndex and columnIndex from state and immediately set them to undefined on scroll
      // as suggested in https://github.com/bvaughn/react-virtualized/issues/1170#issuecomment-539932805
      this.setState({ selectedCell: {} });
    }

    if (document.activeElement === document.body) {
      this.focusTableDebounced();
    }
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
    const columnId = this.props.visibleColumnOrdering[index - 1];
    const { hasStatusColumn } = this.props;
    const widths = this.state.columnWidths || {};
    return index === 0
      ? META_CELL_WIDTH
      : hasStatusColumn && index === 1
      ? STATUS_CELL_WIDTH
      : widths[columnId] || CELL_WIDTH;
  };

  moveResizeBar = () => {
    this.setState({ showResizeBar: true });
    window.addEventListener("mousemove", this.setBarOffset);
  };

  updateColWidth = (index, dx) => {
    if (!this.columnStartSize) {
      this.columnStartSize = this.calcColWidth({ index });
    }
    const columnId = this.props.visibleColumnOrdering[index - 1];
    const newWidth = Math.max(100, this.columnStartSize + dx);
    this.setState(f.update("columnWidths", f.assoc(columnId, newWidth)));
    maybe(this.multiGrid)
      .method("recomputeGridSize", { columnIndex: index })
      .method("invalidateCellSizeAfterRender");
  };

  saveColWidths = () => {
    this.columnStartSize = null;
    if (this.state.showResizeBar) {
      window.removeEventListener("mousemove", this.setBarOffset);
      this.setState({ showResizeBar: false });
    }
    store.dispatch(actions.setColumnWidths(this.state.columnWidths));
    store.dispatch(actions.rerenderTable());
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

  forceTableUpdate = () => {
    this.forceUpdate();
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
    const { langtag, columns, table, actions, navigate } = this.props;
    const gridColumnIndex = columnIndex + 1;
    const column = this.getVisibleElement(columns, columnIndex);
    const width = this.calcColWidth({ index: gridColumnIndex });
    const fixedColCount = this.getFixedColumnCount();
    const shouldMoveResizeBar = gridColumnIndex === fixedColCount - 1;

    return (
      <Rnd
        position={{ x: 0, y: 0 }}
        size={{ width, height: 37 }}
        minWidth={100}
        enableResizing={{ right: column.kind !== ColumnKinds.status }}
        disableDragging
        onResizeStart={shouldMoveResizeBar ? this.moveResizeBar : null}
        onResizeStop={() => this.saveColWidths(gridColumnIndex)}
        onResize={(ev, dr, rf, { width }) =>
          this.updateColWidth(gridColumnIndex, width)
        }
      >
        <ColumnHeader
          langtag={langtag}
          column={column}
          table={table}
          actions={actions}
          navigate={navigate}
        />
      </Rnd>
    );
  };

  renderMetaCell = ({ rowIndex, key }) => {
    const {
      actions,
      actions: { deleteRow },
      langtag,
      rows,
      expandedRowIds,
      table
    } = this.props;

    if (rowIndex < 0) {
      return (
        <ColumnHeader
          key="id-cell"
          title="ID"
          langtag={langtag}
          column={RowIdColumn}
          table={table}
        />
      );
    }

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

  renderSingleCell = ({ columnIndex, rowIndex, style, key }) => {
    const { actions, langtag, columns, tableView } = this.props;
    const { openAnnotations } = this.state;
    const cell = this.getCell(rowIndex, columnIndex);
    const { value } = cell;
    const { width } = style;
    // force update of cell component if locked state changes
    const cellKey = isLocked(cell.row)
      ? `${langtag}-${key}-locked`
      : `${langtag}-${key}`;

    return (
      <Cell
        key={cellKey}
        actions={actions}
        allDisplayValues={tableView.displayValues}
        annotationsOpen={
          !!openAnnotations.cellId && openAnnotations.cellId === cell.id
        }
        cell={cell}
        closeCellContextMenu={this.props.closeCellContextMenu}
        columns={columns}
        displayValue={cell.displayValue}
        focusTable={this.focusTable}
        forceTableUpdate={this.forceTableUpdate}
        isExpandedCell={false}
        langtag={langtag}
        userLangtag={langtag}
        isPrimaryLang={true}
        openCellContextMenu={this.openCellContextMenu}
        rowIndex={rowIndex}
        rows={this.props.rows}
        selectedCell={this.props.selectedCell}
        toggleAnnotationPopup={this.setOpenAnnotations}
        value={value}
        visibleColumns={this.props.visibleColumnOrdering}
        width={width}
      />
    );
  };

  renderExpandedRowCell = ({ columnIndex, rowIndex, key, style }) => {
    const {
      actions,
      columns,
      tableView,
      langtag: userLangtag,
      setSelectedCellExpandedRow
    } = this.props;
    const { openAnnotations } = this.state;
    const column = this.getVisibleElement(columns, columnIndex);
    const cell = this.getCell(rowIndex, columnIndex);
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
              forceTableUpdate={this.forceTableUpdate}
              isExpandedCell={!isPrimaryLang}
              key={`${userLangtag}-${langtag}-${key}`}
              langtag={langtag}
              userLangtag={userLangtag}
              isPrimaryLang={isPrimaryLang}
              openCellContextMenu={this.openCellContextMenu}
              rows={this.props.rows}
              selectedCell={this.props.selectedCell}
              setSelectedCellExpandedRow={setSelectedCellExpandedRow}
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
    const { table, columns, renderNewRowButton } = this.props;
    const hasStatusColumn = columns.find(c => c.kind === ColumnKinds.status);
    const rowButtonColumn = hasStatusColumn ? 2 : 1;

    if (
      table.type !== "settings" &&
      columnIndex === rowButtonColumn &&
      canUserCreateRow({ table })
    ) {
      return renderNewRowButton();
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

  getVisibleElement = (elements, idx) => {
    const columnId = this.props.visibleColumnOrdering[idx];
    return elements[this.columnIndices[columnId]];
  };

  componentWillReceiveProps(next) {
    const newPropKeys = f.keys(next);
    const changeInRowSelection =
      f.contains("expandedRowIds", newPropKeys) &&
      !f.isEmpty(f.xor(next.expandedRowIds, this.props.expandedRowIds));

    if (changeInRowSelection) {
      maybe(this.multiGrid).method("invalidateCellSizeAfterRender");
    }
    if (this.props.rerenderTable !== next.rerenderTable) {
      this.setState({ columnWidths: next.columnWidths });
      maybe(this.multiGrid).method("invalidateCellSizeAfterRender");
    }

    if (!f.equals(next.selectedCell, this.props.selectedCell)) {
      this.setState({ selectedCell: next.selectedCell });
    }
  }

  getScrollInfo = () => {
    const { rows, visibleColumnOrdering } = this.props;
    const { rowId, columnId, align } = this.state.selectedCell;
    const rowIndex = f.findIndex(f.matchesProperty("id", rowId), rows);
    const columnIndex = f.findIndex(f.eq(columnId), visibleColumnOrdering);

    const isSafeIndex = x => f.isNumber(x) && !f.isNaN(x) && x >= 0;

    return {
      columnIndex: isSafeIndex(columnIndex) ? columnIndex + 1 : undefined,
      rowIndex: isSafeIndex(rowIndex) ? rowIndex + 1 : undefined,
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
    const keys = new Set([...Object.keys(prev), Object.keys(this.props)]);
    const changed = Array.from(keys).filter(
      key => !f.equals(prev[key], this.props[key])
    );
    // jump one row down if a new one was created from keyboardnavigation
    if (this.state.newRowAdded && f.size(prev.rows) < f.size(this.props.rows)) {
      tableNavigationWorker.setNextSelectedCell.call(this, Directions.DOWN);

      this.setState({
        ...this.state,
        newRowAdded: false
      });
    }
    if (prev.columns !== this.props.columns) {
      this.cacheColumnIndices(this.props.columns);
    }
    if (!f.isEmpty(changed)) this.focusTable();
  }

  cacheColumnIndices = columns => {
    this.columnIndices = columns.reduce((acc, col, idx) => {
      acc[col.id] = idx;
      return acc;
    }, {});
  };

  divRef = null;

  handleKeypresses;

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
        onKeyDown={this.handleKeyDown}
      >
        <div id="resize-bar" className={resizeBarClass} />
        <AutoSizer>
          {({ height, width }) => {
            return (
              <MultiGrid
                onScroll={this.handleScroll}
                enableFixedColumnScroll
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
                scrollToRow={rowIndex}
                scrollToColumn={columnIndex}
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

const mapStateToProps = state => {
  return {
    columnWidths: f.propOr({}, "tableView.columnWidths", state),
    selectedCell: f.propOr({}, "selectedCell.selectedCell", state)
  };
};

export default reduxActionHoc(VirtualTable, mapStateToProps);
