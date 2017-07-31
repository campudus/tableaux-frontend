/**
 * On many places it is necessary to add or subtract 1 to column/row index, to combine table contents
 * with header row & meta cell column while fitting everything into react-virtualized's MultiGrid
 * cell position indices.
 */

import React, {PropTypes, PureComponent} from "react";
import f from "lodash/fp";
import Cell from "../cells/Cell";
import CellStack from "../cells/CellStack";
import MetaCell from "../cells/MetaCell";
import ColumnHeader from "../columns/ColumnHeader";
import {MultiGrid, AutoSizer, CellMeasurer, CellMeasurerCache} from "react-virtualized";
import {ActionTypes, Langtags} from "../../constants/TableauxConstants";
import {maybe} from "../../helpers/monads";
import Dispatcher from "../../dispatcher/Dispatcher";

const META_CELL_WIDTH = 80;
const HEADER_HEIGHT = 37;
const CELL_WIDTH = 300;
const ROW_HEIGHT = 45;

// Needed to recalculate cell heights when opening/closing an item's translations
const cache = new CellMeasurerCache({
  defaultHeight: ROW_HEIGHT,
  minHeight: ROW_HEIGHT,
  fixedWidth: true
});

// Modify cache as the default test rendering returns invalid height for column headers
// Maybe replacing test rendering with expansion check will speed up rendering even more?
cache.__rowHeight = cache.rowHeight;
cache.rowHeight = (params) => {
  return (params && params.index === 0)
    ? HEADER_HEIGHT
    : cache.__rowHeight(params);
};

export default class VirtualTable extends PureComponent {
  static propTypes = {
    columns: PropTypes.object.isRequired,
    rows: PropTypes.object.isRequired,
    table: PropTypes.object.isRequired,
    langtag: PropTypes.string.isRequired,
    expandedRowIds: PropTypes.array,
    selectedCell: PropTypes.object,
    selectedCellEditing: PropTypes.bool,
    selectedCellExpandedRow: PropTypes.string,
    visibleColumns: PropTypes.array.isRequired
  };

  constructor(props) {
    super(props);
    cache.columnWidth = this.calcColWidth;
    this.updateSelectedCellId();
    this.state = {openAnnotations: {}};
  }

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

  calcColWidth = ({index}) => (index === 0) ? META_CELL_WIDTH : CELL_WIDTH;

  renderEmptyTable = () => null;

  cellRenderer = (gridData) => (
    <CellMeasurer
      cache={cache}
      {...f.pick(["columnIndex", "rowIndex", "key", "parent"], gridData)}
    >
      {
        ({measure}) => {
          // Measure only first cells' height (measure count is O(n^2)) to update row height cache
          const measureFn = (gridData.columnIndex < 2) ? measure : f.noop;
          return (
            <div style={{
              ...gridData.style,
              width: this.calcColWidth(gridData.columnIndex)
            }}
            >
              {this.renderGridCell(f.assoc("measure", measureFn, gridData))}
            </div>
          );
        }
      }
    </CellMeasurer>
  );

  renderGridCell = (gridData) => {
    const {rowIndex, columnIndex} = gridData;
    if (columnIndex === 0) {
      return this.renderMetaCell(
        f.compose(
          f.update("key", (key) => `meta-${key}`),
          f.update("rowIndex", f.add(-1))
        )(gridData)
      );
    }
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
    const firstCell = this.props.rows.at(0).cells.at(0);
    return (
      <ColumnHeader key={key}
                    column={column}
                    langtag={this.props.langtag}
                    tables={firstCell.tables}
                    tableId={firstCell.tableId}
      />
    );
  };

  renderMetaCell = ({rowIndex, key, style}) => {
    if (rowIndex < 0) {
      return <div className="id-meta-cell" key="id-cell" >ID</div>;
    }

    const {langtag, rows, expandedRowIds} = this.props;
    const row = rows.at(rowIndex) || {};
    const isRowExpanded = f.contains(row.id, expandedRowIds);
    const isRowSelected = !!(this.selectedIds && row.id === this.selectedIds.row);

    return (isRowExpanded)
      ? (
        <div key={key}
             className="cell-stack"
        >
          {Langtags.map(
            (lt) => (
              <MetaCell key={`${key}-${lt}`}
                        langtag={lt}
                        expanded={true}
                        selected={isRowSelected}
                        row={row}
              />
            )
          )}
        </div>
      )
      : (
        <MetaCell key={key}
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

  renderSingleCell = ({columnIndex, rowIndex, key, measure, style}) => {
    const {rows, table, langtag, columns} = this.props;
    const {openAnnotations} = this.state;
    const row = rows.at(rowIndex);
    const column = columns.at(columnIndex);
    const cell = this.getCell(rowIndex, columnIndex);
    const isInSelectedRow = row.id === this.selectedIds.row;
    const isSelected = isInSelectedRow && column.id === this.selectedIds.column;
    const isEditing = isSelected && this.props.selectedCellEditing;

    return (
      <Cell key={key}
            cell={cell}
            langtag={langtag}
            row={row}
            table={table}
            annotationsOpen={openAnnotations.cellId && openAnnotations.cellId === cell.id}
            isExpandedCell={false}
            selected={isSelected}
            inSelectedRow={isInSelectedRow}
            editing={isEditing}
            measure={measure}
      />
    );
  };

  renderExpandedRowCell = ({columnIndex, rowIndex, key, measure, style}) => {
    const {rows, columns, table} = this.props;
    const {openAnnotations} = this.state;
    const row = rows.at(rowIndex);
    const column = columns.at(columnIndex);
    const cell = this.getCell(rowIndex, columnIndex);
    const isRowSelected = row.id === this.selectedIds.row;

    return (
      <CellStack key={key} measure={measure} >
        {
          Langtags.map(
            (langtag) => {
              const isPrimaryLang = langtag === f.first(Langtags);
              const isSelected = isRowSelected
                && column.id === this.selectedIds.column
                && langtag === this.selectedIds.langtag;
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
                />
              );
            }
          )
        }
      </CellStack>
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
    !f.isNil(next.selectedCell) && this.updateSelectedCellId(next.selectedCell.id);
  }

  updateSelectedCellId = (idString) => {
    if (f.isEmpty(idString) || !f.isString(idString)) {
      this.selectedIds = {};
      return;
    }
    const selectedLang = this.props.selectedCellExpandedRow;
    const [colId, rowId] = f.takeRight(2, idString.split("-"));
    this.selectedIds = {
      row: parseInt(rowId),
      column: parseInt(colId),
      langtag: selectedLang || null
    };
  };

  render() {
    const {table, expandedRowIds, columns, selectedCell, selectedCellEditing, rows} = this.props;
    const {openAnnotations} = this.state;
    const columnCount = columns
      .filter(f.get("visible"))
      .length + 1;
    const rowCount = (this.props.fullyLoaded) ? f.size(table.rows.models) + 1 : 1;

    devLog(`Virtual table: ${rowCount} rows, ${columnCount} columns, expanded Rows: ${this.props.expandedRowIds}, selectedCell: ${f.get("id", this.props.selectedCell)} ${this.props.selectedCellEditing}`)

    const selectedRow = f.add(1, f.findIndex(f.matchesProperty("id", this.selectedIds.row), rows.models));
    const selectedCol = f.add(1, f.findIndex(f.matchesProperty("id", this.selectedIds.column), columns.models));

    return this.props.fullyLoaded ? (
      <AutoSizer>
        {
          ({height, width}) => {
            return (
              <MultiGrid
                deferredMeasurementCache={cache}
                className="data-wrapper"
                cellRenderer={this.cellRenderer}
                columnCount={columnCount}
                columnWidth={this.calcColWidth}
                noContentRenderer={this.renderEmptyTable}
                rowCount={rowCount}
                rowHeight={cache.rowHeight}
                fixedColumnCount={f.min([columnCount, 2])}
                fixedRowCount={1}
                width={width}
                height={height}
                selectedCell={f.get("id", selectedCell) + selectedCellEditing.toString()}
                expandedRows={expandedRowIds}
                scrollingResetTimeInterval={16}
                scrollToRow={selectedRow}
                scrollToColumn={selectedCol}
                openAnnotations={openAnnotations}
              />
            );
          }
        }
      </AutoSizer>
    ) : null;
  }
}
