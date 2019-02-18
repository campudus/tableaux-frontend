import React, { Component } from "react";
import PropTypes from "prop-types";
import ReactDOM from "react-dom";
// import KeyboardShortcutsHelper from "../../helpers/KeyboardShortcutsHelper";
// import * as tableRowsWorker from "./tableRowsWorker";
// import * as tableNavigationWorker from "./tableNavigationWorker";
// import * as tableContextMenu from "./tableContextMenu";
import listensToClickOutside from "react-onclickoutside";
import f from "lodash/fp";
import {
  maybe,
  stopPropagation,
  preventDefault,
  doto
} from "../../helpers/functools";
import i18n from "i18next";
import RowContextMenu from "../contextMenu/RowContextMenu";
import { Portal } from "react-portal";
import VirtualTable from "./VirtualTable";
import TableauxRouter from "../../router/router";

class Table extends Component {
  /**
   * This is an anti-pattern on purpose
   * Don't change this, its more performant than using this.state !
   */
  constructor(props) {
    super(props);
    this.headerDOMElement = null;
    this.keyboardRecentlyUsedTimer = null;
    this.tableDOMNode = null;
    this.tableRowsDom = null; // scrolling rows container

    this.state = {
      windowHeight: window.innerHeight,
      scrolledHorizontal: 0,
      selectedCell: null,
      selectedCellEditing: false,
      // needed for multilanguage cell selection
      expandedRowIds: [], // Array
      selectedCellExpandedRow: null,
      rowContextMenu: null,
      showScrollToLeftButton: false
    };
  }

  componentWillMount() {
    // Dispatcher.on(ActionTypes.SELECT_NEXT_CELL, tableNavigationWorker.setNextSelectedCell, this);
    // Dispatcher.on(ActionTypes.CREATE_ROW_OR_SELECT_NEXT_CELL, tableRowsWorker.createRowOrSelectNext, this);
    // Dispatcher.on(ActionTypes.DUPLICATE_ROW, tableRowsWorker.duplicateRow, this);

    window.addEventListener("resize", this.windowResize);
  }

  componentWillReceiveProps(np) {
    if (!this.props.fullyLoaded && np.fullyLoaded) {
      this.props.rows.on("add", tableRowsWorker.rowAdded.bind(this));
    }
  }

  //   componentDidUpdate() {
  //     // When overlay is open we don't want anything to force focus inside the table
  //     if (!this.props.overlayOpen) {
  //       // tableNavigationWorker.checkFocusInsideTable.call(this);
  //     }
  //   }

  toggleExpandedRow = rowId => () => {
    const { expandedRowIds } = this.state;
    const newExpandedRowIds = f.cond([
      [f.includes(rowId), f.pull(rowId)],
      [f.stubTrue, f.concat(rowId)]
    ])(expandedRowIds);
    this.setState({ expandedRowIds: newExpandedRowIds });
  };

  handleClickOutside = () => {
    const {
      actions,
      tableView: { selectedCell, editing }
    } = this.props;
    if (!f.isEmpty(selectedCell) && !editing) {
      actions.toggleCellSelection({
        selected: false,
        pushHistory: false,
        rowId: f.prop("rowId", selectedCell)
      });
    }
  };

  onMouseDownHandler = e => {
    // We don't prevent mouse down behaviour when focus is outside of table. This fixes the issue to close select boxes
    // in the header
    if (
      maybe(this.tableDOMNode)
        .exec("contains", document.activeElement)
        .getOrElse(false)
    ) {
      // deselect a cell when clicking column. Right now we cannot deselect when clicking in the white area because we
      // can't differentiate between clicking the scrollbar or content
      if (
        maybe(this.headerDOMElement)
          .exec("contains", e.target)
          .getOrElse(false)
      ) {
        this.handleClickOutside(e);
        e.preventDefault();
      }

      /*
       Important: prevents losing the focus of a cell when clicking something.
       When a child component inside of the Table needs focus attach a "onMouseDown" event to it and
       call "event.stopPropagation()". This prevents calling this function and enables the standard browser behaviour
       */
    }
  };

  windowResize = () => {
    this.setState({ windowHeight: window.innerHeight });
  };

  findAndStoreTableDiv = virtualDOMNode => {
    this.tableDOMNode = ReactDOM.findDOMNode(virtualDOMNode);
  };

  noRowsInfo = () => {
    const { rows, table } = this.props;
    return this.props.fullyLoaded && f.isEmpty(rows) ? (
      <Portal isOpened>
        <div className="table-has-no-rows">
          {rows === table.rows
            ? i18n.t("table:has-no-rows")
            : i18n.t("table:search_no_results")}
        </div>
      </Portal>
    ) : null;
  };

  showRowContextMenu = ({ langtag, cell }) => event => {
    const { pageX, pageY } = event;
    const { actions, rows } = this.props;
    this.setState({
      rowContextMenu: {
        x: pageX,
        y: pageY,
        row: cell.row,
        table: cell.table,
        actions,
        langtag,
        cell,
        rows
      }
    });
  };

  hideRowContextMenu = event => {
    stopPropagation(event);
    preventDefault(event);
    this.setState({ rowContextMenu: null });
  };

  render() {
    const {
      actions,
      columns,
      rows,
      tables,
      table,
      langtag,
      tableView,
      visibleColumns,
      visibleRows
    } = this.props;
    const {
      expandedRowIds,
      selectedCellExpandedRow,
      rowContextMenu
    } = this.state;
    const rowIds = f.map("id", rows);

    const displayValues = doto(
      tableView,
      f.prop(["displayValues", table.id]),
      f.filter(({ id }) => f.contains(id, rowIds)),
      f.map("values")
    );

    return (
      <section
        id="table-wrapper"
        tabIndex="-1"
        onKeyDown={
          () =>
            console.log(
              "onKeyDown"
            ) /*KeyboardShortcutsHelper.onKeyboardShortcut(tableNavigationWorker.getKeyboardShortcuts.bind(
          this))*/
        }
        onMouseDown={this.onMouseDownHandler}
      >
        <div className="tableaux-table" ref="tableInner">
          <VirtualTable
            key={`virtual-table-${f.get("id", table)}`}
            actions={actions}
            columns={columns}
            visibleColumns={visibleColumns}
            visibleRows={visibleRows}
            ref={this.findAndStoreTableDiv}
            rows={rows}
            tableView={tableView}
            focusTable={
              () =>
                null /*tableNavigationWorker.checkFocusInsideTable.call(this)*/
            }
            displayValues={displayValues}
            table={table}
            tables={tables}
            langtag={langtag}
            selectedCell={(tableView && tableView.selectedCell) || {}}
            selectedCellEditing={(tableView && tableView.editiong) || false}
            selectedCellExpandedRow={selectedCellExpandedRow}
            toggleExpandedRow={this.toggleExpandedRow}
            expandedRowIds={expandedRowIds}
            fullyLoaded={this.props.fullyLoaded}
            openCellContextMenu={this.showRowContextMenu}
            closeCellContextMenu={this.hideRowContextMenu}
          />
        </div>
        {this.noRowsInfo()}
        {rowContextMenu ? (
          <RowContextMenu
            {...rowContextMenu}
            onClickOutside={this.hideRowContextMenu}
            action={actions}
          />
        ) : null}
      </section>
    );
  }
}

Table.propTypes = {
  actions: PropTypes.object.isRequired,
  tableView: PropTypes.object.isRequired,
  langtag: PropTypes.string.isRequired,
  rows: PropTypes.array,
  columns: PropTypes.array
};

export default listensToClickOutside(Table);
