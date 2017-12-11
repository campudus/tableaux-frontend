/**
 * On many places it is necessary to add or subtract 1 to column/row index, to combine table contents
 * with header row & meta cell column while fitting everything into react-virtualized's MultiGrid
 * cell position indices.
 */

import React, {PureComponent} from "react";
import PropTypes from "prop-types";
import f from "lodash/fp";
import Cell, {getAnnotationState} from "../cells/Cell";
import MetaCell from "../cells/MetaCell";
import ColumnHeader from "../columns/ColumnHeader";
import {AutoSizer} from "react-virtualized";
import {ActionTypes, ColumnKinds, Langtags} from "../../constants/TableauxConstants";
import {either, maybe} from "../../helpers/functools";
import Dispatcher from "../../dispatcher/Dispatcher";
import AddNewRowButton from "../rows/NewRow";

import MultiGrid from "./GrudGrid";
import {isLocked} from "../../helpers/annotationHelper";

const META_CELL_WIDTH = 80;
const HEADER_HEIGHT = 37;
const CELL_WIDTH = 300;
const ROW_HEIGHT = 45;

export default class VirtualTable extends PureComponent {
  static propTypes = {
    columns: PropTypes.object.isRequired,
    columnKeys: PropTypes.string,
    rows: PropTypes.object.isRequired,
    rowKeys: PropTypes.string, // re-render hint
    table: PropTypes.object.isRequired,
    tables: PropTypes.object.isRequired,
    langtag: PropTypes.string.isRequired,
    expandedRowIds: PropTypes.array,
    selectedCell: PropTypes.object,
    selectedCellEditing: PropTypes.bool,
    selectedCellExpandedRow: PropTypes.string,
    visibleColumns: PropTypes.string.isRequired
  };

  constructor(props) {
    super(props);
    this.updateSelectedCellId();
    this.state = {
      openAnnotations: {},
      scrolledCell: {},
      lastScrolledCell: null
    };
    this.expandedRowIds = props.expandedRowIds;
  }

  colWidths = new Map([[0, META_CELL_WIDTH]]);
  columnStartSize = null;

  getStoredView = () => either(localStorage)
    .map(f.get("tableViews"))
    .map(JSON.parse)
    .map(f.get([this.props.table.id, "default"]))
    .getOrElse({});

  componentWillMount() {
    f.flow(
      f.get("columnWidths"),
      f.toPairs
     )(this.getStoredView())
     .forEach(
       ([idx, width]) => this.colWidths.set(f.toNumber(idx), width)
     );
  }

  saveColWidths = () => {
    this.columnStartSize = null;
    if (!localStorage) {
      return;
    }
    const widthObj = {};
    this.colWidths.forEach(
      (width, idx) => {
        if (idx > 0 && width !== CELL_WIDTH) {
          widthObj[idx] = width;
        }
      }
    );

    const views = this.getStoredView();
    localStorage["tableViews"] = JSON.stringify(
      f.assoc([this.props.table.id.toString(), "default", "columnWidths"], widthObj, views)
    );
  };

  calcRowHeight = ({index}) => {
    if (index === 0) {
      return HEADER_HEIGHT;
    }
    const row = maybe(this.props.rows)
      .exec("at", index - 1)
      .getOrElse({});
    const rowId = f.get("id", row);
    return (f.contains(rowId, this.expandedRowIds))
      ? f.size(Langtags) * ROW_HEIGHT
      : ROW_HEIGHT;
  };

  calcColWidth = ({index}) => this.colWidths.get(index) || CELL_WIDTH;

  updateColWidth = (index, dx) => {
    if (!this.columnStartSize) {
      this.columnStartSize = this.calcColWidth({index});
    }
    const newWidth = Math.max(100, this.columnStartSize + dx);
    this.colWidths.set(index, newWidth);
    maybe(this.multiGrid)
      .method("recomputeGridSize")
      .method("invalidateCellSizeAfterRender");
    this.forceUpdate();
  };

  componentDidMount = () => {
    Dispatcher.on(ActionTypes.OPEN_ANNOTATIONS_VIEWER, this.setOpenAnnotations);
    Dispatcher.on(ActionTypes.CLOSE_ANNOTATIONS_VIEWER, this.setOpenAnnotations);
    Dispatcher.on(ActionTypes.JUMP_TO_DUPE, this.jumpToLastRow);
  };

  componentWillUnmount = () => {
    Dispatcher.off(ActionTypes.OPEN_ANNOTATIONS_VIEWER, this.setOpenAnnotations);
    Dispatcher.off(ActionTypes.CLOSE_ANNOTATIONS_VIEWER, this.setOpenAnnotations);
    Dispatcher.off(ActionTypes.JUMP_TO_DUPE, this.jumpToLastRow);
  };

  setOpenAnnotations = (cellInfo) => {
    if (f.isNil(cellInfo) && !f.isEmpty(this.state.openAnnotations)) {
      this.setState({openAnnotations: {}});
    } else if (!f.isNil(cellInfo)) {
      this.setState({openAnnotations: cellInfo});
    }
  };

  renderEmptyTable = () => null;

  cellRenderer = (gridData) => {
    return (
      <div style={gridData.style}
           key={gridData.key}
      >
        {this.renderGridCell(gridData)}
      </div>
    );
  };

  renderGridCell = (gridData) => {
    const {rowIndex, columnIndex} = gridData;
    // if we're below all rows, render buttons
    if (rowIndex > f.size(this.props.rows.models)) {
      return this.renderButton(gridData);
    }

    // if we're in the first column, render meta cells
    if (columnIndex === 0) {
      return this.renderMetaCell(
        f.flow(
          f.update("key", (key) => `meta-${key}`),
          f.update("rowIndex", f.add(-1))
        )(gridData)
      );
    }

    // else render either column headers or boring normal cells
    return (rowIndex === 0)
      ? this.renderColumnHeader(
        f.flow(
          f.update("key", (key) => `col-${key}`),
          f.update("columnIndex", f.add(-1))
        )(gridData)
      )
      : this.renderCell(
        f.flow(
          f.update("key", (key) => `cell-${key}`),
          f.update("rowIndex", f.add(-1)),
          f.update("columnIndex", f.add(-1))
        )(gridData)
      );
  };

  renderColumnHeader = ({columnIndex}) => {
    const visibleColumns = this.props.columns
                               .filter(
                                 (col, idx) => idx === 0 || col.visible
                               );
    const column = visibleColumns[columnIndex];
    const {table, tables} = this.props;
    return (
      <ColumnHeader
        column={column}
        langtag={this.props.langtag}
        tables={tables}
        tableId={table.id}
        resizeHandler={this.updateColWidth}
        resizeFinishedHandler={this.saveColWidths}
        index={columnIndex + 1}
        width={this.calcColWidth({index: columnIndex + 1})}
      />
    );
  };

  renderMetaCell = ({rowIndex, key}) => {
    if (rowIndex < 0) {
      return <div className="id-meta-cell" key="id-cell">ID</div>;
    }

    const {langtag, rows, expandedRowIds, selectedCellExpandedRow} = this.props;
    const row = rows.at(rowIndex) || {};
    const isRowExpanded = f.contains(row.id, expandedRowIds);
    const isRowSelected = !!(this.selectedIds && row.id === this.selectedIds.row);
    const locked = isLocked(row);

    return (isRowExpanded)
      ? (
        <div
          className="cell-stack"
        >
          {Langtags.map(
            (lt) => (
              <MetaCell key={`${key}-${lt}`}
                        langtag={lt}
                        expanded={true}
                        selected={isRowSelected && lt === selectedCellExpandedRow}
                        row={row}
                        isLocked={locked}
              />
            )
          )}
        </div>
      )
      : (
        <MetaCell key={`${key}-${row.id}`}
                  langtag={langtag}
                  row={row}
                  selected={isRowSelected}
                  expanded={false}
                  isLocked={locked}
        />
      );
  };

  renderCell = (gridData) => {
    const {rows, expandedRowIds} = this.props;
    const {rowIndex} = gridData;
    const row = maybe(rows)
      .exec("at", rowIndex)
      .getOrElse({});
    return (f.contains(row.id, expandedRowIds))
      ? this.renderExpandedRowCell(gridData)
      : this.renderSingleCell(gridData);
  };

  renderSingleCell = ({columnIndex, rowIndex}) => {
    const {rows, table, langtag} = this.props;
    const {openAnnotations} = this.state;
    const row = rows.at(rowIndex);
    const cell = this.getCell(rowIndex, columnIndex);
    const isInSelectedRow = row.id === this.selectedIds.row;
    const isSelected = !!this.props.selectedCell && cell.id === this.props.selectedCell.id;
    const isEditing = isSelected && this.props.selectedCellEditing;

    const displayValue = f.isArray(cell.displayValue)
      ? f.flow(
      f.map(f.get(langtag)),
      f.join(";")
    )(cell.displayValue) || ""
      : f.get(langtag, cell.displayValue) || "";

    return (
      <Cell cell={cell}
            annotationState={getAnnotationState(cell)}
            langtag={langtag}
            row={row}
            table={table}
            annotationsOpen={openAnnotations.cellId && openAnnotations.cellId === cell.id}
            isExpandedCell={false}
            selected={isSelected}
            inSelectedRow={isInSelectedRow}
            editing={isEditing}
            value={displayValue}
      />
    );
  };

  renderExpandedRowCell = ({columnIndex, rowIndex, key}) => {
    const {rows, columns, table} = this.props;
    const {openAnnotations} = this.state;
    const row = rows.at(rowIndex);
    const column = columns.at(columnIndex);
    const cell = this.getCell(rowIndex, columnIndex);
    const annotationsState = getAnnotationState(cell);

    return (
      // key={cell.id}
      <div className="cell-stack">
        {
          Langtags.map(
            (langtag) => {
              const isPrimaryLang = langtag === f.first(Langtags);
              const isRowSelected = row.id === this.selectedIds.row
                && langtag === this.selectedIds.langtag;
              const isSelected = isRowSelected
                && column.id === this.selectedIds.column;
              const isEditing = isSelected && this.props.selectedCellEditing;
              const displayValue = f.isArray(cell.displayValue)
                ? f.flow(
                f.map(f.get(langtag)),
                f.join(";")
              )(cell.displayValue) || ""
                : f.get(langtag, cell.displayValue) || "";
              return (
                <Cell key={`${langtag}-${key}`}
                      annotationState={annotationsState}
                      cell={cell}
                      langtag={langtag}
                      row={row}
                      table={table}
                      annotationsOpen={isPrimaryLang && openAnnotations.cellId && cell.id === openAnnotations.cellId}
                      isExpandedCell={!isPrimaryLang}
                      selected={isSelected}
                      inSelectedRow={isRowSelected}
                      editing={isEditing}
                      value={displayValue}
                />
              );
            }
          )
        }
      </div>
    );
  };

  renderButton = ({columnIndex}) => {
    const {table} = this.props;
    if (columnIndex === 1) {
      return (
        <AddNewRowButton table={table} onAdd={this.jumpToLastRow} />
      );
    }
    return (
      <div style={{
        height: "100%",
        width: "100%",
        backgroundColor: "white"
      }}
      />
    );
  };

  getCell = (rowIndex, columnIndex) => {
    const {columns, rows} = this.props;
    const cells = rows.at(rowIndex).cells.models;

    // This hideous C-style loop avoids allocating and garbage-collecting
    // (visibleCols + overscanCol) * (visibleRows + overscanRows) arrays in
    // a performance-critical section, thus considerably speeding up rendering.
    this.getCell.visibleColIdx = -1;
    this.getCell.totalColIdx = 0;
    for (; this.getCell.totalColIdx < cells.length; ++this.getCell.totalColIdx) {
      if (columns.models[this.getCell.totalColIdx].visible || this.getCell.totalColIdx === 0) {
        ++this.getCell.visibleColIdx;
      }
      if (this.getCell.visibleColIdx === columnIndex) {
        break;
      }
    }
    return cells[this.getCell.totalColIdx];
    // Original implementation which eats too much CPU-time
    //    const visibleCells = cells.models.filter(this.filterVisibleCells);
    //    return visibleCells[columnIndex];
  };

  // adding element with id:0 to columns collection results in duplicates
  // https://github.com/AmpersandJS/ampersand-collection/issues/54
  filterVisibleCells = (cell, columnIdx) => columnIdx === 0
    || (f.get("visible", this.props.columns.at(columnIdx)) && this.props.columns.at(columnIdx) !== this.props.columns.at(0));

  componentWillReceiveProps(next) {
    const newPropKeys = f.keys(next);
    const changeInRowSelection = f.contains("expandedRowIds", newPropKeys)
      && !f.isEmpty(f.xor(next.expandedRowIds, this.expandedRowIds));

    if (f.contains("selectedCell", newPropKeys) && !changeInRowSelection && next.scrolledCell !== this.state.lastScrolledCell) {
      this.scrollToCell((next.selectedCell || {}).id, next.selectedCellExpandedRow);
    } else if (changeInRowSelection) {
      this.expandedRowIds = next.expandedRowIds;
      maybe(this.multiGrid)
        .method("invalidateCellSizeAfterRender");
    }
  }

  updateSelectedCellId = (idString, selectedLang = this.props.selectedCellExpandedRow) => {
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
    const {scrolledCell, lastScrolledCell} = this.state;
    if (!cellId || f.get("scrolledCell", scrolledCell) === lastScrolledCell) { // when called by cell deselection
      this.setState({
        scrolledCell: {},
        lastScrolledCell
      });
      return false;
    }
    const {columns, rows} = this.props;
    const rowIndex = f.add(1, f.findIndex(f.matchesProperty("id", this.selectedIds.row), rows.models));
    const columnIndex = f.add(1, f.findIndex(f.matchesProperty("id", this.selectedIds.column), columns.models));
    this.setState({
      scrolledCell: {
        columnIndex,
        rowIndex,
        scrolledCell: cellId
      }
    });
  };

  storeGridElement = (node) => {
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
    const {rows} = this.props;
    this.setState({
      scrolledCell: {rowIndex: f.size(rows)}
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
      selectedCellExpandedRow
    } = this.props;
    const {openAnnotations, scrolledCell, lastScrolledCell} = this.state;
    const {columnIndex, rowIndex} = (!f.isEmpty(scrolledCell) && scrolledCell.scrolledCell !== lastScrolledCell)
      ? scrolledCell
      : {};
    const visibleColumns = columns.filter(this.filterVisibleCells);
    const columnCount = f.size(visibleColumns) + 1;
    const rowCount = f.size(rows.models) + 2;
    const selectedCellKey = `${f.get("id", selectedCell)}-${selectedCellEditing}-${selectedCellExpandedRow}`;
    const shouldIDColBeGrey = f.get("kind", columns.first) === ColumnKinds.concat
      && rowCount * 45 + 37 > window.innerHeight; // table might scroll (data rows + button + 37 + tableaux-header) >
                                                  // window

    return (
      <AutoSizer>
        {
          ({height, width}) => (
            <MultiGrid ref={this.storeGridElement}
                       key={(columnCount < 3) ? "no-fixed-rows" : "with-fixed-rows"}
                       className="data-wrapper"
                       cellRenderer={this.cellRenderer}
                       columnCount={columnCount}
                       columnWidth={this.calcColWidth}
                       noContentRenderer={this.renderEmptyTable}
                       rowCount={rowCount}
                       rowHeight={this.calcRowHeight}
                       fixedColumnCount={(columnCount < 3) ? 0 : f.min([columnCount, 2])}
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
                         backgroundColor: (shouldIDColBeGrey) ? "#f9f9f9" : "white"
                       }}
            />
          )
        }
      </AutoSizer>
    );
  }
}
