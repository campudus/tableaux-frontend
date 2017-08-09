/**
 * On many places it is necessary to add or subtract 1 to column/row index, to combine table contents
 * with header row & meta cell column while fitting everything into react-virtualized's MultiGrid
 * cell position indices.
 */

import React, {PropTypes, PureComponent} from "react";
import f from "lodash/fp";
import Cell from "../cells/Cell";
import MetaCell from "../cells/MetaCell";
import ColumnHeader from "../columns/ColumnHeader";
import {AutoSizer} from "react-virtualized";
import {ActionTypes, Langtags} from "../../constants/TableauxConstants";
import {maybe} from "../../helpers/monads";
import Dispatcher from "../../dispatcher/Dispatcher";
import AddNewRowButton from "../rows/NewRow";
import GrudGrid from "./GrudGrid";

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
      scrolledCell: {}
    };
    this.expandedRowIds = props.expandedRowIds;
  }

  rowWidths = new Map([[0, META_CELL_WIDTH]]);

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

  calcColWidth = ({index}) => {
    const result = this.rowWidths.get(index) || CELL_WIDTH;
    devLog("column width", index, result)
    return result
  };

  updateColWidth = (index, dx, done = false) => {
    const oldWidth = this.calcColWidth(index);
    const newWidth = oldWidth + dx;
    devLog("Resizing column", index, "to", newWidth)
    if (newWidth === CELL_WIDTH) {
      this.rowWidths.delete(index);
    } else {
      this.rowWidths.set(index, newWidth);
    }
    if (done) {
      maybe(this.multiGrid)
        .method("recomputeGridSize")
        .method("forceUpdateGrids")
      devLog("Row widths:", this.rowWidths)
    }
  };

  componentDidMount = () => {
    Dispatcher.on(ActionTypes.OPEN_ANNOTATIONS_VIEWER, this.setOpenAnnotations);
    Dispatcher.on(ActionTypes.CLOSE_ANNOTATIONS_VIEWER, this.setOpenAnnotations);
  };

  componentWillUnmount = () => {
    Dispatcher.off(ActionTypes.OPEN_ANNOTATIONS_VIEWER, this.setOpenAnnotations);
    Dispatcher.off(ActionTypes.CLOSE_ANNOTATIONS_VIEWER, this.setOpenAnnotations);
  };

  setOpenAnnotations = (cellInfo) => {
    if (f.isNil(cellInfo) && !f.isEmpty(this.state.openAnnotations)) {
      this.setState({openAnnotations: {}});
    } else if (!f.isNil(cellInfo)) {
      this.setState({openAnnotations: cellInfo});
    }
  };

  renderEmptyTable = () => null;

  cellRenderer = (gridData) => (
    <div {...f.pick(["style", "key"], gridData)}
    >
      {this.renderGridCell(gridData)}
    </div>
  );

  renderGridCell = (gridData) => {
    const {rowIndex, columnIndex} = gridData;
    // if we're below all rows, render buttons
    if (rowIndex > f.size(this.props.rows.models)) {
      return this.renderButton(gridData);
    }

    // if we're in the first column, render meta cells
    if (columnIndex === 0) {
      return this.renderMetaCell(
        f.compose(
          f.update("key", (key) => `meta-${key}`),
          f.update("rowIndex", f.add(-1))
        )(gridData)
      );
    }

    // else render either column headers or boring normal cells
    return (rowIndex === 0)
      ? this.renderColumnHeader(
        f.compose(
          f.update("key", (key) => `col-${key}`),
          f.update("columnIndex", f.add(-1))
        )(gridData)
      )
      : this.renderCell(
        f.compose(
          f.update("key", (key) => `cell-${key}`),
          f.update("rowIndex", f.add(-1)),
          f.update("columnIndex", f.add(-1))
        )(gridData)
      );
  };

  renderColumnHeader = ({columnIndex, key}) => {
    const column = this.props.columns.at(columnIndex);
    const {table, tables} = this.props;
    return (
      <ColumnHeader key={`column-header-${column.id}-${column.kind}`}
                    column={column}
                    langtag={this.props.langtag}
                    tables={tables}
                    tableId={table.id}
                    dragHandler={this.updateColWidth}
                    index={columnIndex + 1}
      />
    );
  };

  renderMetaCell = ({rowIndex, key, style}) => {
    if (rowIndex < 0) {
      return <div className="id-meta-cell" key="id-cell" >ID</div>;
    }

    const {langtag, rows, expandedRowIds, selectedCellExpandedRow} = this.props;
    const row = rows.at(rowIndex) || {};
    const isRowExpanded = f.contains(row.id, expandedRowIds);
    const isRowSelected = !!(this.selectedIds && row.id === this.selectedIds.row);

    return (isRowExpanded)
      ? (
        <div key={`${key}-${row.id}`}
             className="cell-stack"
        >
          {Langtags.map(
            (lt) => (
              <MetaCell key={`${key}-${lt}`}
                        langtag={lt}
                        expanded={true}
                        selected={isRowSelected && lt === selectedCellExpandedRow}
                        row={row}
              />
            )
          )}
        </div>
      )
      : (
        <MetaCell key={`${key}-${row.id}`}
                  style={style}
                  langtag={langtag}
                  row={row}
                  selected={isRowSelected}
                  expanded={false}
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

  renderSingleCell = ({columnIndex, rowIndex, isScrolling, isVisible}) => {
    const {rows, table, langtag, columns} = this.props;
    const {openAnnotations} = this.state;
    const row = rows.at(rowIndex);
    const column = columns.at(columnIndex);
    const cell = this.getCell(rowIndex, columnIndex);
    const isInSelectedRow = row.id === this.selectedIds.row;
    const isSelected = isInSelectedRow && column.id === this.selectedIds.column;
    const isEditing = isSelected && this.props.selectedCellEditing;
    const showPreview = columnIndex > 2 && (isScrolling || !isVisible);

    return (
      <Cell key={cell.id}
            cell={cell}
            langtag={langtag}
            row={row}
            table={table}
            annotationsOpen={openAnnotations.cellId && openAnnotations.cellId === cell.id}
            isExpandedCell={false}
            selected={isSelected}
            inSelectedRow={isInSelectedRow}
            editing={isEditing}
            preview={showPreview}
      />
    );
  };

  renderExpandedRowCell = ({columnIndex, rowIndex, key, isScrolling, isVisible}) => {
    const {rows, columns, table} = this.props;
    const {openAnnotations} = this.state;
    const row = rows.at(rowIndex);
    const column = columns.at(columnIndex);
    const cell = this.getCell(rowIndex, columnIndex);
    const showPreview = columnIndex > 0 && (isScrolling || !isVisible);

    return (
      <div className="cell-stack" key={cell.id} >
        {
          Langtags.map(
            (langtag) => {
              const isPrimaryLang = langtag === f.first(Langtags);
              const isRowSelected = row.id === this.selectedIds.row
                && langtag === this.selectedIds.langtag;
              const isSelected = isRowSelected
                && column.id === this.selectedIds.column;
              const isEditing = isSelected && this.props.selectedCellEditing;
              return (
                <Cell key={`${langtag}-${key}`}
                      cell={cell}
                      langtag={langtag}
                      row={row}
                      table={table}
                      annotationsOpen={isPrimaryLang && openAnnotations.cellId && cell.id === openAnnotations.cellId}
                      isExpandedCell={!isPrimaryLang}
                      selected={isSelected}
                      inSelectedRow={isRowSelected}
                      editing={isEditing}
                      preview={showPreview}
                />
              );
            }
          )
        }
      </div>
    );
  };

  renderButton = ({columnIndex, style}) => {
    const {table} = this.props;
    if (columnIndex === 1) {
      return (
        <AddNewRowButton table={table} />
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
    const {rows} = this.props;
    const cells = rows.at(rowIndex).cells;
    const visibleCells = cells.models.filter(this.filterVisibleCells);
    return visibleCells[columnIndex];
  };

  filterVisibleCells = (cell, columnId) => columnId === 0 || this.props.columns.at(columnId).visible;

  componentWillReceiveProps(next) {
    const newPropKeys = f.keys(next);
    if (f.contains("selectedCell", newPropKeys)) {
      this.scrollToCell((next.selectedCell || {}).id, next.selectedCellExpandedRow);
    }
    if (f.contains("expandedRowIds", newPropKeys)
      && !f.isEmpty(f.xor(next.expandedRowIds, this.expandedRowIds))
    ) {
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
    if (!cellId) {  // when called by cell deselection
      return false;
    }
    const {columns, rows} = this.props;
    const rowIndex = f.add(1, f.findIndex(f.matchesProperty("id", this.selectedIds.row), rows.models));
    const columnIndex = f.add(1, f.findIndex(f.matchesProperty("id", this.selectedIds.column), columns.models));
    this.setState({
      scrolledCell: {columnIndex, rowIndex}
    });
  };

  storeGridElement = (node) => {
    this.multiGrid = node;
  };

  componentDidUpdate() {
    // Release control of scolling position once cell has been focused
    // Has to be done this way as Grid.scrollToCell() is not exposed properly
    // by MultiGrid
    if (!f.isEmpty(this.state.scrolledCell)) {
      this.setState({scrolledCell: {}});
    }
  }

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
    const {openAnnotations, scrolledCell: {columnIndex, rowIndex}, scrollLeft} = this.state;
    const visibleColumns = columns.filter(this.filterVisibleCells);
    const columnCount = f.size(visibleColumns) + 1;
    const rowCount = f.size(rows.models) + 2;

    const scrollPosition = (f.isNumber(scrollLeft) && scrollLeft > 0 && scrollLeft) || null;
    const selectedCellKey = `${f.get("id", selectedCell)}-${selectedCellEditing}-${selectedCellExpandedRow}`;

    return (
      <AutoSizer>
        {
          ({height, width}) => {
            return (
              <GrudGrid ref={this.storeGridElement}
                        className="data-wrapper"
                        cellRenderer={this.cellRenderer}
                        columnCount={columnCount}
                        columnWidth={this.calcColWidth}
                        noContentRenderer={this.renderEmptyTable}
                        rowCount={rowCount}
                        rowHeight={this.calcRowHeight}
                        fixedColumnCount={f.min([columnCount, 2])}
                        fixedRowCount={1}
                        width={width}
                        height={height}
                        selectedCell={selectedCellKey}
                        expandedRows={expandedRowIds}
                        openAnnotations={openAnnotations}
                        scrollToRow={rowIndex}
                        scrollToColumn={columnIndex}
                        scrollLeft={scrollPosition}
                        rowKeys={rowKeys}
                        columnKeys={columnKeys}
              />
            );
          }
        }
      </AutoSizer>
    );
  }
}
