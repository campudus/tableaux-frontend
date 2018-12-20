import React, {Component} from "react";
import PropTypes from "prop-types";
import ReactDOM from "react-dom";
// import Dispatcher from "../../dispatcher/Dispatcher";
import {ActionTypes} from "../../constants/TableauxConstants";
// import KeyboardShortcutsHelper from "../../helpers/KeyboardShortcutsHelper";
// import * as tableRowsWorker from "./tableRowsWorker";
// import * as tableNavigationWorker from "./tableNavigationWorker";
// import * as tableContextMenu from "./tableContextMenu";
import listensToClickOutside from "react-onclickoutside";
// import connectToAmpersand from "../helperComponents/connectToAmpersand";
import f from "lodash/fp";
import {maybe} from "../../helpers/functools";
import i18n from "i18next";
import {Portal} from "react-portal";

import VirtualTable from "./VirtualTable";

// @connectToAmpersand
// @listensToClickOutside

class Table extends Component {
  // PureComponent will not react to updates called from connectToAmpersand
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
      offsetTableData: 0,
      windowHeight: window.innerHeight,
      scrolledHorizontal: 0,
      selectedCell: null,
      selectedCellEditing: false,
      // needed for multilanguage cell selection
      expandedRowIds: null, // Array
      selectedCellExpandedRow: null,
      rowContextMenu: null,
      showScrollToLeftButton: false
    };
  }

  componentWillMount() {
    // Dispatcher.on(ActionTypes.TOGGLE_CELL_SELECTION, tableNavigationWorker.toggleCellSelection, this);
    // Dispatcher.on(ActionTypes.TOGGLE_CELL_EDITING, tableNavigationWorker.toggleCellEditing, this);
    // Dispatcher.on(ActionTypes.SELECT_NEXT_CELL, tableNavigationWorker.setNextSelectedCell, this);
    // Dispatcher.on(ActionTypes.TOGGLE_ROW_EXPAND, tableRowsWorker.toggleRowExpand, this);
    // Dispatcher.on(ActionTypes.CREATE_ROW_OR_SELECT_NEXT_CELL, tableRowsWorker.createRowOrSelectNext, this);
    // Dispatcher.on(ActionTypes.SHOW_ROW_CONTEXT_MENU, tableContextMenu.showRowContextMenu, this);
    // Dispatcher.on(ActionTypes.CLOSE_ROW_CONTEXT_MENU, tableContextMenu.closeRowContextMenu, this);
    // Dispatcher.on(ActionTypes.DUPLICATE_ROW, tableRowsWorker.duplicateRow, this);

    window.addEventListener("resize", this.windowResize);
  }

  componentWillUnmount() {
    // Dispatcher.off(ActionTypes.TOGGLE_CELL_SELECTION, tableNavigationWorker.toggleCellSelection, this);
    // Dispatcher.off(ActionTypes.TOGGLE_CELL_EDITING, tableNavigationWorker.toggleCellEditing, this);
    // Dispatcher.off(ActionTypes.SELECT_NEXT_CELL, tableNavigationWorker.setNextSelectedCell, this);
    // Dispatcher.off(ActionTypes.TOGGLE_ROW_EXPAND, tableRowsWorker.toggleRowExpand, this);
    // Dispatcher.off(ActionTypes.CREATE_ROW_OR_SELECT_NEXT_CELL, tableRowsWorker.createRowOrSelectNext, this);
    // Dispatcher.off(ActionTypes.SHOW_ROW_CONTEXT_MENU, tableContextMenu.showRowContextMenu, this);
    // Dispatcher.off(ActionTypes.CLOSE_ROW_CONTEXT_MENU, tableContextMenu.closeRowContextMenu, this);
    // Dispatcher.off(ActionTypes.DUPLICATE_ROW, tableRowsWorker.duplicateRow, this);
    // window.removeEventListener("resize", this.windowResize);
    // this.props.table.rows.off("add", tableRowsWorker.rowAdded.bind(this));
    // window.GLOBAL_TABLEAUX.tableRowsDom = null;
  }

  componentWillReceiveProps(np) {
    if (!this.props.fullyLoaded && np.fullyLoaded) {
      this.props.rows.on("add", tableRowsWorker.rowAdded.bind(this));
    }
  }

  componentDidUpdate() {
    // When overlay is open we don't want anything to force focus inside the table
    if (!this.props.overlayOpen) {
      // tableNavigationWorker.checkFocusInsideTable.call(this);
    }
  }

  handleClickOutside = event => {
    /*
     Prevent to render when clicking on already selected cell and don't clear when some cell is editing. This way cells
     like shorttext will be saved on the first click outside and on the second click it gets deselected.
     */
    if (this.state.selectedCell && !this.state.selectedCellEditing) {
      this.setState({
        selectedCell: null
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
    this.setState({windowHeight: window.innerHeight});
  };

  findAndStoreTableDiv = virtualDOMNode => {
    this.tableDOMNode = ReactDOM.findDOMNode(virtualDOMNode);
  };

  noRowsInfo = () => {
    const {rows, table} = this.props;
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

  render() {
    const {columns, rows, tables, table, langtag} = this.props;
    console.lo
    const {
      selectedCell,
      selectedCellEditing,
      expandedRowIds,
      selectedCellExpandedRow
    } = this.state;
    const rowKeys = f.flow(
      f.keys,
      f.toString
    )(rows);
    const columnKeys = f.flow(
      f.keys,
      f.toString
    )(columns);

    return (
      <section
        id="table-wrapper"
        ref="tableWrapper"
        tabIndex="-1"
        onKeyDown={
          () =>
            console.log(
              "onKeyDown"
            ) /*KeyboardShortcutsHelper.onKeyboardShortcut(tableNavigationWorker.getKeyboardShortcuts.bind(
          this))*/
        }
        onMouseDown={this.onMouseDownHandler}>
        <div className="tableaux-table" ref="tableInner">
          <VirtualTable
            key={`virtual-table-${f.get("id", table)}`}
            columns={columns}
            ref={this.findAndStoreTableDiv}
            rows={rows}
            focusTable={
              () =>
                null /*tableNavigationWorker.checkFocusInsideTable.call(this)*/
            }
            rowKeys={rowKeys}
            columnKeys={columnKeys}
            table={table}
            tables={tables}
            langtag={langtag}
            selectedCell={selectedCell}
            selectedCellEditing={selectedCellEditing}
            selectedCellExpandedRow={selectedCellExpandedRow}
            expandedRowIds={expandedRowIds}
            visibleColumns={f.map(column => !!column, columns).toString()}
            fullyLoaded={this.props.fullyLoaded}
          />
        </div>
        {this.noRowsInfo()}
        {/*tableContextMenu.getRowContextMenu.call(this)*/ null}
      </section>
    );
  }
}

// Table.propTypes = {
//   langtag: PropTypes.string.isRequired,
//   table: PropTypes.object.isRequired,
//   overlayOpen: PropTypes.bool,
//   rows: PropTypes.object,
//   rowKeys: PropTypes.string.isRequired,
//   columnKeys: PropTypes.string,
//   tables: PropTypes.object.isRequired,
//   fullyLoaded: PropTypes.bool.isRequired
// };

export default Table;
