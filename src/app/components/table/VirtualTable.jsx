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
  constructor(props) {
    super(props);
    this.updateSelectedCell();
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

  setOpenAnnotations = cell => {
    if (f.isNil(cell) && !f.isEmpty(this.state.openAnnotations)) {
      this.setState({ openAnnotations: {} });
    } else if (!f.isNil(cell)) {
      this.setState({ openAnnotations: { cellId: cell.id } });
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
    const column = this.getVisibleElement(this.props.columns, columnIndex);
    const { table, tables } = this.props;
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
    const { actions, langtag, columns, tableView } = this.props;
    const { openAnnotations } = this.state;
    const cell = this.getCell(rowIndex, columnIndex);
    const { value } = cell;
    const isInSelectedRow = cell.row.id === this.selectedIds.row;
    const isSelected = this.isCellSelected(cell.column.id, cell.row.id);
    const isEditing =
      isSelected && f.getOr(false, "tableView.editing", this.props);

    return (
      <Cell
        actions={actions}
        value={value}
        allDisplayValues={tableView.displayValues}
        displayValue={cell.displayValue}
        cell={cell}
        columns={columns}
        annotationState={null /*getAnnotationState(cell)*/}
        focusTable={this.props.test}
        langtag={langtag}
        annotationsOpen={
          openAnnotations.cellId && openAnnotations.cellId === cell.id
        }
        isExpandedCell={false}
        selected={isSelected}
        inSelectedRow={isInSelectedRow}
        editing={isEditing}
        toggleAnnotationPopup={this.setOpenAnnotations}
        openCellContextMenu={this.props.openCellContextMenu}
        closeCellContextMenu={this.props.closeCellContextMenu}
      />
    );
  };

  renderExpandedRowCell = ({ columnIndex, rowIndex, key }) => {
    const { actions, rows, columns, tableView } = this.props;
    const { openAnnotations } = this.state;
    const row = rows[rowIndex];
    const column = this.getVisibleElement(columns, columnIndex);
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
              toggleAnnotationPopup={this.setOpenAnnotations}
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
    try {
      const { rows, visibleRows } = this.props;
      const values = rows[rowIndex].values;
      const cells = rows[rowIndex].cells;
      const value = this.getVisibleElement(values, columnIndex);
      const cell = this.getVisibleElement(cells, columnIndex);
      return {
        ...cell,
        value,
        row: rows[rowIndex],
        displayValue: this.getDisplayValueWithFallback(
          visibleRows[rowIndex],
          columnIndex,
          cell.column,
          value
        )
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
    elements[this.visibleColumnIndices[idx]];

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
      this.scrollToCell(next.selectedCell, next.selectedCellExpandedRow);
    } else if (changeInRowSelection) {
      maybe(this.multiGrid).method("invalidateCellSizeAfterRender");
    }
  }

  updateSelectedCell = (
    cell,
    selectedLang = this.props.selectedCellExpandedRow
  ) => {
    if (f.isEmpty(cell)) {
      this.selectedIds = {};
      return;
    }
    const { columnId, rowId } = cell;
    this.selectedIds = {
      row: parseInt(rowId),
      column: parseInt(columnId),
      langtag: selectedLang || null
    };
  };

  scrollToCell = (cell, langtag = this.props.selectedCellExpandedRow) => {
    this.updateSelectedCell(cell, langtag);
    const { scrolledCell, lastScrolledCell } = this.state;

    if (f.isEmpty(cell) || scrolledCell.cell === lastScrolledCell) {
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
        scrolledCell: cell
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
      // release after table was rendered once for real
      requestAnimationFrame(() =>
        this.setState({
          scrolledCell: {},
          lastScrolledCell: f.get("scrolledCell", this.state.scrolledCell)
        })
      );
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
      columnKeys,
      selectedCell,
      selectedCellEditing,
      selectedCellExpandedRow,
      langtag
    } = this.props;
    const { openAnnotations, scrolledCell, lastScrolledCell } = this.state;
    const { columnIndex, rowIndex } =
      !f.isEmpty(scrolledCell) && scrolledCell.scrolledCell !== lastScrolledCell
        ? scrolledCell
        : {};

    this.visibleColumnIndices = f
      .range(0, columns.length)
      .filter(this.filterVisibleCells);

    const columnCount = f.size(this.visibleColumnIndices) + 1;
    const rowCount = f.size(rows) + 1;

    const isSelectedCellValid = selectedCell.rowId && selectedCell.columnId;
    const selectedCellKey = isSelectedCellValid
      ? `${f.get(
          "id",
          this.getCell(selectedCell.rowId - 1, selectedCell.columnId - 1)
        )}-${selectedCellEditing}-${selectedCellExpandedRow}`
      : "";

    const shouldIDColBeGrey =
      f.get("kind", columns[0] /*columns.first()*/) === ColumnKinds.concat &&
      rowCount * 45 + 37 > window.innerHeight; // table might scroll (data rows + button + 37 + tableaux-header) >

    return (
      <AutoSizer>
        {({ height, width }) => {
          return (
            <MultiGrid
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
              fixedColumnCount={columnCount < 3 ? 0 : f.min([columnCount, 2])}
              fixedRowCount={1}
              width={width}
              height={height}
              selectedCell={selectedCellKey}
              expandedRows={expandedRowIds}
              openAnnotations={openAnnotations}
              scrollToRow={rowIndex}
              scrollToColumn={columnIndex}
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
