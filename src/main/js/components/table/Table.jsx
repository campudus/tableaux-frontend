import React from "react";
import ReactDOM from "react-dom";
import Dispatcher from "../../dispatcher/Dispatcher";
import Columns from "./../columns/Columns.jsx";
import Rows from "./../rows/Rows.jsx";
import {ActionTypes, Directions, ColumnKinds, RowHeight} from "../../constants/TableauxConstants";
import KeyboardShortcutsHelper from "../../helpers/KeyboardShortcutsHelper";
import * as tableRowsWorker from "./tableRowsWorker";
import * as tableNavigationWorker from "./tableNavigationWorker";
import * as tableContextMenu from "./tableContextMenu";
import listensToClickOutside from "react-onclickoutside";
import JumpSpinner from "./JumpSpinner";

//Worker
@listensToClickOutside
class Table extends React.Component {

  /**
   * This is an anti-pattern on purpose
   * Don't change this, its more performant than using this.state !
   */
  constructor(props) {
    super(props);
    this.headerDOMElement = null;
    this.scrolledXBefore = 0;
    this.selectNewCreatedRow = false;
    this.keyboardRecentlyUsedTimer = null;
    this.tableHeaderId = "tableHeader";
    this.tableDOMNode = null;
    this.tableDOMOffsetY = 0;
    this.tableRowsDom = null; //scrolling rows container
    this.columnsDom = null;

    this.state = {
      offsetTableData: 0,
      windowHeight: window.innerHeight,
      scrolledHorizontal: 0,
      selectedCell: null,
      selectedCellEditing: false,
      //needed for multilanguage cell selection
      expandedRowIds: null, //Array
      selectedCellExpandedRow: null,
      shouldCellFocus: true,
      rowContextMenu: null,
      showScrollToLeftButton: false
    }
  }

  componentWillMount() {
    Dispatcher.on(ActionTypes.TOGGLE_CELL_SELECTION, tableNavigationWorker.toggleCellSelection, this);
    Dispatcher.on(ActionTypes.TOGGLE_CELL_EDITING, tableNavigationWorker.toggleCellEditing, this);
    Dispatcher.on(ActionTypes.SELECT_NEXT_CELL, tableNavigationWorker.setNextSelectedCell, this);
    Dispatcher.on(ActionTypes.TOGGLE_ROW_EXPAND, tableRowsWorker.toggleRowExpand, this);
    Dispatcher.on(ActionTypes.CREATE_ROW_OR_SELECT_NEXT_CELL, tableRowsWorker.createRowOrSelectNext, this);
    Dispatcher.on(ActionTypes.DISABLE_SHOULD_CELL_FOCUS, tableNavigationWorker.disableShouldCellFocus, this);
    Dispatcher.on(ActionTypes.ENABLE_SHOULD_CELL_FOCUS, tableNavigationWorker.enableShouldCellFocus, this);
    Dispatcher.on(ActionTypes.SHOW_ROW_CONTEXT_MENU, tableContextMenu.showRowContextMenu, this);
    Dispatcher.on(ActionTypes.CLOSE_ROW_CONTEXT_MENU, tableContextMenu.closeRowContextMenu, this);
    Dispatcher.on(ActionTypes.DUPLICATE_ROW, tableRowsWorker.duplicateRow, this);

    window.addEventListener("resize", this.windowResize);
    this.props.rows.on("add", tableRowsWorker.rowAdded.bind(this));
  }

  componentWillUnmount() {
    Dispatcher.off(ActionTypes.TOGGLE_CELL_SELECTION, tableNavigationWorker.toggleCellSelection, this);
    Dispatcher.off(ActionTypes.TOGGLE_CELL_EDITING, tableNavigationWorker.toggleCellEditing, this);
    Dispatcher.off(ActionTypes.SELECT_NEXT_CELL, tableNavigationWorker.setNextSelectedCell, this);
    Dispatcher.off(ActionTypes.TOGGLE_ROW_EXPAND, tableRowsWorker.toggleRowExpand, this);
    Dispatcher.off(ActionTypes.CREATE_ROW_OR_SELECT_NEXT_CELL, tableRowsWorker.createRowOrSelectNext, this);
    Dispatcher.off(ActionTypes.DISABLE_SHOULD_CELL_FOCUS, tableNavigationWorker.disableShouldCellFocus, this);
    Dispatcher.off(ActionTypes.ENABLE_SHOULD_CELL_FOCUS, tableNavigationWorker.enableShouldCellFocus, this);
    Dispatcher.off(ActionTypes.SHOW_ROW_CONTEXT_MENU, tableContextMenu.showRowContextMenu, this);
    Dispatcher.off(ActionTypes.CLOSE_ROW_CONTEXT_MENU, tableContextMenu.closeRowContextMenu, this);
    Dispatcher.off(ActionTypes.DUPLICATE_ROW, tableRowsWorker.duplicateRow, this);

    window.removeEventListener("resize", this.windowResize);
    this.props.table.rows.off("add", tableRowsWorker.rowAdded.bind(this));
    window.GLOBAL_TABLEAUX.tableRowsDom = null;
  }

  componentDidMount() {
    let {tableRowsDom, columnsDom, headerDOMElement, tableHeaderId, tableDOMNode, tableDOMOffsetY} = this;
    let {tableRows, columns} = this.refs;

    tableRowsDom = ReactDOM.findDOMNode(tableRows);
    columnsDom = ReactDOM.findDOMNode(columns);
    this.setState({offsetTableData: tableRowsDom.getBoundingClientRect().top});
    //Don't change this to state, its more performant during scroll
    headerDOMElement = document.getElementById(tableHeaderId);
    tableDOMNode = ReactDOM.findDOMNode(this);
    tableDOMOffsetY = tableDOMNode.getBoundingClientRect().top;
    this.columnsDom = columnsDom;
    this.headerDOMElement = headerDOMElement;
    this.tableDOMNode = tableDOMNode;
    this.tableDOMOffsetY = tableDOMOffsetY;

    //save a reference globally for children. Cells use this.
    window.GLOBAL_TABLEAUX.tableRowsDom = this.tableRowsDom = tableRowsDom;
  }

  componentDidUpdate() {
    console.log("Table did update.");
    //When overlay is open we don't want anything to force focus inside the table
    if (!this.props.overlayOpen) {
      //Just update when used with keyboard or when clicking explicitly on a cell
      if (tableNavigationWorker.shouldCellFocus.call(this)) {
        tableNavigationWorker.updateScrollViewToSelectedCell.call(this);
      }
      tableNavigationWorker.checkFocusInsideTable.call(this);
    }
  }

  handleClickOutside = (event) => {
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

  onMouseDownHandler = (e) => {
    //We don't prevent mouse down behaviour when focus is outside of table. This fixes the issue to close select boxes
    // in the header
    if (this.tableDOMNode.contains(document.activeElement)) {
      //deselect a cell when clicking column. Right now we cannot deselect when clicking in the white area because we
      // can't differentiate between clicking the scrollbar or content
      if (this.columnsDom.contains(e.target)) {
        this.handleClickOutside(e);
      }

      /*
       Important: prevents loosing the focus of a cell when clicking something.
       When a child component inside of the Table needs focus attach a "onMouseDown" event to it and
       call "event.stopPropagation()". This prevents calling this function and enables the standard browser behaviour
       */
      e.preventDefault();
    }
  };

  handleScroll = (e) => {
    //only when horizontal scroll changed
    if (e.target.scrollLeft != this.scrolledXBefore) {
      var scrolledX = e.target.scrollLeft;
      //Don't change this to state, its more performant during scroll
      this.headerDOMElement.style.left = -scrolledX + "px";
      this.scrolledXBefore = scrolledX;

      //update the scroll to left button when necessary
      if (scrolledX != 0 && !this.state.showScrollToLeftButton) {
        this.setState({
          showScrollToLeftButton: true,
          shouldCellFocus: false
        });
      } else if (scrolledX === 0 && this.state.showScrollToLeftButton) {
        this.setState({
          showScrollToLeftButton: false,
          shouldCellFocus: false
        });
      }
    }
  };

  windowResize = () => {
    this.setState({windowHeight: window.innerHeight});
  };

  tableDataHeight = () => {
    return (this.state.windowHeight - this.state.offsetTableData);
  };

  render() {
    const {langtag, table:{columns}, rows, table} = this.props;
    const {selectedCell, selectedCellEditing, expandedRowIds, selectedCellExpandedRow, showScrollToLeftButton} = this.state;

    return (
      <section id="table-wrapper" ref="tableWrapper" tabIndex="-1" onScroll={this.handleScroll}
               onKeyDown={KeyboardShortcutsHelper.onKeyboardShortcut(tableNavigationWorker.getKeyboardShortcuts.bind(
                 this))}
               onMouseDown={this.onMouseDownHandler}>
        <div className="tableaux-table" ref="tableInner">
          <JumpSpinner />
          <Columns ref="columns" table={table} langtag={langtag}
                   columns={columns}
          />
          <Rows ref="tableRows"
                rowsHeight={this.tableDataHeight()}
                rows={rows}
                langtag={langtag}
                selectedCell={selectedCell}
                selectedCellEditing={selectedCellEditing}
                expandedRowIds={expandedRowIds}
                selectedCellExpandedRow={selectedCellExpandedRow}
                table={table}
                shouldCellFocus={tableNavigationWorker.shouldCellFocus.call(this)}
          />
          <span id="scrollToLeftStart" className={!showScrollToLeftButton ? 'hide' : null}
                title="scroll to the beginning of table."
                onClick={tableNavigationWorker.scrollToLeftStart.bind(this)}><i className="fa fa-chevron-left" /></span>
        </div>
        {tableContextMenu.getRowContextMenu.call(this)}
      </section>
    );
  }
}

Table.propTypes = {
  langtag: React.PropTypes.string.isRequired,
  table: React.PropTypes.object.isRequired,
  overlayOpen: React.PropTypes.bool.isRequired,
  rows: React.PropTypes.object
};

module.exports = Table;
