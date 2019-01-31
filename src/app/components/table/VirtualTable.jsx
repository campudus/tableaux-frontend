/**
 * On many places it is necessary to add or subtract 1 to column/row index, to combine table contents
 * with header row & meta cell column while fitting everything into react-virtualized's MultiGrid
 * cell position indices.
 */

import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import f from "lodash/fp";
import Cell, { getAnnotationState } from "../cells/Cell";
import MetaCell from "../cells/MetaCell";
import ColumnHeader from "../columns/ColumnHeader";
import { AutoSizer } from "react-virtualized";
import { ColumnKinds, Langtags } from "../../constants/TableauxConstants";
import { either, maybe } from "../../helpers/functools";
import AddNewRowButton from "../rows/NewRow";
import getDisplayValue from "../../helpers/getDisplayValue";

import MultiGrid from "./GrudGrid";
import { isLocked } from "../../helpers/annotationHelper";

const META_CELL_WIDTH = 80;
const HEADER_HEIGHT = 37;
const CELL_WIDTH = 300;
const ROW_HEIGHT = 45;

export default class VirtualTable extends PureComponent {
  // static propTypes = {
  //   columns: PropTypes.object.isRequired,
  //   columnKeys: PropTypes.string,
  //   rows: PropTypes.object.isRequired,
  //   rowKeys: PropTypes.string, // re-render hint
  //   table: PropTypes.object.isRequired,
  //   tables: PropTypes.object.isRequired,
  //   langtag: PropTypes.string.isRequired,
  //   expandedRowIds: PropTypes.array,
  //   selectedCell: PropTypes.object,
  //   selectedCellEditing: PropTypes.bool,
  //   selectedCellExpandedRow: PropTypes.string,
  //   visibleColumns: PropTypes.string.isRequired
  // };

  constructor(props) {
    super(props);
    this.updateSelectedCellId();
    this.state = {
      openAnnotations: {},
      scrolledCell: {},
      lastScrolledCell: null
    };
  }

  isCellSelected = (columnId, rowId, langtag) => {
    const { tableView } = this.props;
    const selected = f.getOr({}, "selectedCell", tableView);
    return (
      rowId === selected.rowId &&
      columnId === selected.columnId &&
      (f.isEmpty(langtag) || langtag === selected.langtag)
    );
  };

  colWidths = new Map([[0, META_CELL_WIDTH]]);
  columnStartSize = null;

  getStoredView = () =>
    either(localStorage)
      .map(f.get("tableViews"))
      .map(JSON.parse)
      .map(f.get([this.props.table.id, "default"]))
      .getOrElse({});

  componentWillMount() {
    f.flow(
      f.get("columnWidths"),
      f.toPairs
    )(this.getStoredView()).forEach(([idx, width]) =>
      this.colWidths.set(f.toNumber(idx), width)
    );
  }

  saveColWidths = () => {
    this.columnStartSize = null;
    if (!localStorage) {
      return;
    }
    const widthObj = {};
    this.colWidths.forEach((width, idx) => {
      if (idx > 0 && width !== CELL_WIDTH) {
        widthObj[idx] = width;
      }
    });

    const views = this.getStoredView();
    localStorage["tableViews"] = JSON.stringify(
      f.assoc(
        [this.props.table.id.toString(), "default", "columnWidths"],
        widthObj,
        views
      )
    );
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

  calcColWidth = ({ index }) => this.colWidths.get(index) || CELL_WIDTH;

  updateColWidth = (index, dx) => {
    if (!this.columnStartSize) {
      this.columnStartSize = this.calcColWidth({ index });
    }
    const newWidth = Math.max(100, this.columnStartSize + dx);
    this.colWidths.set(index, newWidth);
    maybe(this.multiGrid)
      .method("recomputeGridSize")
      .method("invalidateCellSizeAfterRender");
    this.forceUpdate();
  };

  componentDidMount = () => {
    // Dispatcher.on(ActionTypes.OPEN_ANNOTATIONS_VIEWER, this.setOpenAnnotations);
    // Dispatcher.on(ActionTypes.CLOSE_ANNOTATIONS_VIEWER, this.setOpenAnnotations);
    // Dispatcher.on(ActionTypes.JUMP_TO_DUPE, this.jumpToLastRow);
  };

  componentWillUnmount = () => {
    // Dispatcher.off(ActionTypes.OPEN_ANNOTATIONS_VIEWER, this.setOpenAnnotations);
    // Dispatcher.off(ActionTypes.CLOSE_ANNOTATIONS_VIEWER, this.setOpenAnnotations);
    // Dispatcher.off(ActionTypes.JUMP_TO_DUPE, this.jumpToLastRow);
  };

  setOpenAnnotations = cellInfo => {
    if (f.isNil(cellInfo) && !f.isEmpty(this.state.openAnnotations)) {
      this.setState({ openAnnotations: {} });
    } else if (!f.isNil(cellInfo)) {
      this.setState({ openAnnotations: cellInfo });
    }
  };

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
      return this.renderMetaCell(
        f.flow(
          f.update("key", key => `meta-${key}`),
          f.update("rowIndex", f.add(-1))
        )(gridData)
      );
    }

    // else render either column headers or boring normal cells
    return gridData.rowIndex === 0
      ? this.renderColumnHeader(
          f.flow(
            f.update("key", key => `col-${key}`),
            f.update("columnIndex", f.add(-1))
          )(gridData)
        )
      : this.renderCell(
          f.flow(
            f.update("key", key => `cell-${key}`),
            f.update("rowIndex", f.add(-1)),
            f.update("columnIndex", f.add(-1))
          )(gridData)
        );
  };

  renderColumnHeader = ({ columnIndex }) => {
    const { table, tables, visibleColumns } = this.props;
    const column = visibleColumns[columnIndex];
    return (
      <ColumnHeader
        column={column}
        langtag={this.props.langtag}
        tables={tables}
        tableId={table.id}
        resizeHandler={this.updateColWidth}
        resizeFinishedHandler={this.saveColWidths}
        index={columnIndex + 1}
        width={this.calcColWidth({ index: columnIndex + 1 })}
      />
    );
  };

  renderMetaCell = ({ rowIndex, key }) => {
    if (rowIndex < 0) {
      return (
        <div className="id-meta-cell" key="id-cell">
          ID
        </div>
      );
    }

    const {
      langtag,
      rows,
      expandedRowIds,
      selectedCellExpandedRow,
      toggleExpandedRow
    } = this.props;
    const row = rows[rowIndex] || {};
    const isRowExpanded = f.contains(row.id, expandedRowIds);
    const isRowSelected = !!(
      this.selectedIds && row.id === this.selectedIds.row
    );
    const locked = isLocked(row);

    return isRowExpanded ? (
      <div className="cell-stack">
        {Langtags.map(lt => (
          <MetaCell
            toggleExpandedRow={toggleExpandedRow(row.id)}
            key={`${key}-${lt}`}
            langtag={lt}
            expanded={true}
            selected={isRowSelected && lt === selectedCellExpandedRow}
            row={row}
            isLocked={locked}
          />
        ))}
      </div>
    ) : (
      <MetaCell
        toggleExpandedRow={toggleExpandedRow(row.id)}
        key={`${key}-${row.id}`}
        langtag={langtag}
        row={row}
        selected={isRowSelected}
        expanded={false}
        isLocked={locked}
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

  renderSingleCell = ({ columnIndex, rowIndex }) => {
    const { actions, rows, table, langtag, columns, tableView, visibleColumns } = this.props;
    const { openAnnotations } = this.state;
    const row = rows[rowIndex];
    const cell = this.getCell(rowIndex, columnIndex);
==== BASE ====
    const visibleColumns = this.props.columns.filter(
      (col, idx) => idx === 0 || col.visible
    );
    const column = visibleColumns[columnIndex];
==== BASE ====
    const { value, annotations } = cell;
    const displayValue = this.getDisplayValueWithFallback(
      rowIndex,
      columnIndex,
      column,
      cell.value
    );
    const isInSelectedRow = row.id === this.selectedIds.row;
    const isSelected = this.isCellSelected(column.id, row.id);
    const isEditing =
      isSelected && f.getOr(false, "tableView.editing", this.props);

    return (
      <Cell
        actions={actions}
        value={value}
        allDisplayValues={tableView.displayValues}
        displayValue={displayValue}
        column={column}
        columns={columns}
        annotationState={null /*getAnnotationState(cell)*/}
        focusTable={this.props.test}
        langtag={langtag}
        row={row}
        table={table}
        annotationsOpen={
          // openAnnotations.cellId && openAnnotations.cellId === cell.id
          false
        }
        isExpandedCell={false}
        selected={isSelected}
        inSelectedRow={isInSelectedRow}
        editing={isEditing}
        openCellContextMenu={this.props.openCellContextMenu}
        closeCellContextMenu={this.props.closeCellContextMenu}
      />
    );
  };

  renderExpandedRowCell = ({ columnIndex, rowIndex, key }) => {
    const { actions, rows, columns, table, tableView } = this.props;
    const { openAnnotations } = this.state;
    const row = rows[rowIndex];
    const column = this.visibleColumns[columnIndex];
    const cell = this.getCell(rowIndex, columnIndex);
    const annotationsState = getAnnotationState(cell);
    const tableLangtag = this.props.langtag;

    return (
      // key={cell.id}
      <div className="cell-stack">
        {Langtags.map(langtag => {
          const isPrimaryLang = langtag === f.first(Langtags);
          const isRowSelected =
            row.id === f.get(["selectedCell", "rowId"], tableView) &&
            langtag === f.prop(["SelectedCell", "langtag"], tableView);
          const isSelected = this.isCellSelected(column.id, row.id, langtag);
          const isEditing =
            isSelected && f.getOr(false, "tableView.editing", this.props);
          const displayValue = this.getDisplayValueWithFallback(
            rowIndex,
            columnIndex,
            column,
            cell.value
          );

          return (
            <Cell
              actions={actions}
              key={`${langtag}-${key}`}
              annotationState={annotationsState}
              column={column}
              cell={cell}
              langtag={langtag}
              row={row}
              table={table}
              annotationsOpen={
                isPrimaryLang &&
                openAnnotations.cellId &&
                cell.id === openAnnotations.cellId
              }
              isExpandedCell={!isPrimaryLang}
              selected={isSelected}
              inSelectedRow={isRowSelected}
              editing={isEditing}
              displayValue={displayValue}
              allDisplayValues={tableView.displayValues}
              value={cell.value}
              openCellContextMenu={this.props.openCellContextMenu}
              closeCellContextMenu={this.props.closeCellContextMenu}
            />
          );
        })}
      </div>
    );
  };

  renderButton = ({ columnIndex }) => {
    const { table } = this.props;
    if (columnIndex === 1) {
      return <AddNewRowButton table={table} onAdd={this.jumpToLastRow} />;
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
    const { columns, rows } = this.props;
    const cells = rows[rowIndex].values;
    // return cells[columnIndex];

    // This hideous C-style loop avoids allocating and garbage-collecting
    // (visibleCols + overscanCol) * (visibleRows + overscanRows) arrays in
    // a performance-critical section, thus considerably speeding up rendering.
    this.getCell.visibleColIdx = -1;
    this.getCell.totalColIdx = 0;
    for (
      ;
      this.getCell.totalColIdx < cells.length;
      ++this.getCell.totalColIdx
    ) {
      if (
        columns[this.getCell.totalColIdx].visible ||
        this.getCell.totalColIdx === 0
      ) {
        ++this.getCell.visibleColIdx;
      }
      if (this.getCell.visibleColIdx === columnIndex) {
        break;
      }
    }
    return cells[this.getCell.totalColIdx];
    // Original implementation which eats too much CPU-time
    // const visibleCells = cells.filter(this.filterVisibleCells);
    // return visibleCells[columnIndex];
  };

  getDisplayValueWithFallback = (rowIndex, columnIndex, column, value) =>
    f.get([rowIndex, columnIndex], this.visibleDisplayValues) ||
    getDisplayValue(column, value);

  filterVisibleCells = (cell, columnIdx) =>
    columnIdx === 0 || f.get("visible", this.props.columns[columnIdx]);

  componentWillReceiveProps(next) {
    const newPropKeys = f.keys(next);
    const changeInRowSelection =
      f.contains("expandedRowIds", newPropKeys) &&
      !f.isEmpty(f.xor(next.expandedRowIds, this.props.expandedRowIds));

    if (
      f.contains("selectedCell", newPropKeys) &&
      !changeInRowSelection &&
      next.scrolledCell !== this.state.lastScrolledCell
    ) {
      this.scrollToCell(
        (next.selectedCell || {}).id,
        next.selectedCellExpandedRow
      );
    } else if (changeInRowSelection) {
      maybe(this.multiGrid).method("invalidateCellSizeAfterRender");
    }
  }

  updateSelectedCellId = (
    idString,
    selectedLang = this.props.selectedCellExpandedRow
  ) => {
    if (f.isEmpty(idString) || !f.isString(idString)) {
      this.selectedIds = {};
      return;
    }
    const [colId, rowId] = f.takeRight(2, idString.split("-"));
    this.selectedIds = {
      row: parseInt(rowId),
      column: parseInt(colId),
      langtag: selectedLang || null
    };
  };

  scrollToCell = (cellId, langtag = this.props.selectedCellExpandedRow) => {
    this.updateSelectedCellId(cellId, langtag);
    const { scrolledCell, lastScrolledCell } = this.state;
    if (!cellId || f.get("scrolledCell", scrolledCell) === lastScrolledCell) {
      // when called by cell deselection
      this.setState({
        scrolledCell: {},
        lastScrolledCell
      });
      return false;
    }
    const { columns, rows } = this.props;
    const rowIndex = f.add(
      1,
      f.findIndex(f.matchesProperty("id", this.selectedIds.row), rows)
    );
    const columnIndex = f.add(
      1,
      f.findIndex(f.matchesProperty("id", this.selectedIds.column), columns)
    );
    this.setState({
      scrolledCell: {
        columnIndex,
        rowIndex,
        scrolledCell: cellId
      }
    });
  };

  storeGridElement = node => {
    this.multiGrid = node;
  };

  componentDidUpdate() {
    // Release control of scrolling position once cell has been focused
    // Has to be done this way as Grid.scrollToCell() is not exposed properly
    // by MultiGrid
    if (!f.isEmpty(this.state.scrolledCell)) {
      this.setState({
        scrolledCell: {},
        lastScrolledCell: f.get("scrolledCell", this.state.scrolledCell)
      });
    }
  }

  jumpToLastRow = () => {
    const { rows } = this.props;
    this.setState({
      scrolledCell: { rowIndex: f.size(rows) }
    });
  };

  render() {
    const {
      rows,
      expandedRowIds,
      columns,
      rowKeys,
      columnKeys,
      selectedCell,
      selectedCellEditing,
      selectedCellExpandedRow,
      displayValues,
      visibleColumns
    } = this.props;
    const { openAnnotations, scrolledCell, lastScrolledCell } = this.state;
    const { columnIndex, rowIndex } =
      !f.isEmpty(scrolledCell) && scrolledCell.scrolledCell !== lastScrolledCell
        ? scrolledCell
        : {};

    // cache visible elements for this render cycle, so we won't need
    // to recalculate for each cell
    this.visibleColumns = columns.filter(this.filterVisibleCells);
    this.visibleDisplayValues = (displayValues || []).map(col =>
      col.filter(this.filterVisibleCells)
    );

    const columnCount = f.size(this.visibleColumns) + 1;
    const rowCount = f.size(rows) + 1;
    const selectedCellKey = `${f.get(
      "id",
      selectedCell
    )}-${selectedCellEditing}-${selectedCellExpandedRow}`;
    const shouldIDColBeGrey =
      f.get("kind", columns[0] /*columns.first()*/) === ColumnKinds.concat &&
      rowCount * 45 + 37 > window.innerHeight; // table might scroll (data rows + button + 37 + tableaux-header) >

    return (
      <AutoSizer>
        {({ height, width }) => {
          return (
            <MultiGrid
              ref={this.storeGridElement}
              key={columnCount < 3 ? "no-fixed-rows" : "with-fixed-rows"}
              className="data-wrapper"
              cellRenderer={this.cellRenderer}
              columnCount={columnCount}
              columnWidth={this.calcColWidth}
              noContentRenderer={this.renderEmptyTable}
              rowCount={rowCount}
              rowHeight={this.calcRowHeight}
              fixedColumnCount={columnCount < 3 ? 0 : f.min([columnCount, 2])}
              fixedRowCount={1}
              width={width}
              height={height}
              selectedCell={selectedCellKey}
              expandedRows={expandedRowIds}
              openAnnotations={openAnnotations}
              scrollToRow={rowIndex}
              scrollToColumn={columnIndex}
              rowKeys={rowKeys}
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
    );
  }
}
