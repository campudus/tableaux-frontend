var React = require('react');
var ReactDOM = require('react-dom');
var _ = require('lodash');
var App = require('ampersand-app');
var AmpersandMixin = require('ampersand-react-mixin');
var Dispatcher = require('../../dispatcher/Dispatcher');
var Columns = require('./../columns/Columns.jsx');
var Rows = require('./../rows/Rows.jsx');
var OutsideClick = require('react-onclickoutside');
var ActionCreator = require('../../actions/ActionCreator');
import {ActionTypes,Directions,ColumnKinds,RowHeight} from '../../constants/TableauxConstants';
import RowContextMenu from './../contextMenu/RowContextMenu';
import listensToClickOutside from '../../../../../node_modules/react-onclickoutside/decorator';
import {duplicateRow} from './tableRowsWorker';
import KeyboardShortcutsHelper from '../../helpers/KeyboardShortcutsHelper';
const RowContextMenuWithClickOutside = listensToClickOutside(RowContextMenu);


var Table = React.createClass({
  mixins : [AmpersandMixin, OutsideClick],

  displayName : "Table",

  propTypes : {
    langtag : React.PropTypes.string.isRequired,
    table : React.PropTypes.object.isRequired,
    overlayOpen : React.PropTypes.bool.isRequired,
    rows : React.PropTypes.object,
  },

  /**
   * This is an anti-patter on purpose
   * Don't change this, its more performant than using this.state !
   */
  headerDOMElement : null,
  scrolledXBefore : 0,
  selectNewCreatedRow : false,
  keyboardRecentlyUsedTimer : null,
  tableHeaderId : "tableHeader",
  tableDOMNode : null,
  tableDOMOffsetY : 0,
  tableRowsDom : null, //scrolling rows container
  columnsDom : null,

  getInitialState() {
    return {
      offsetTableData : 0,
      windowHeight : window.innerHeight,
      scrolledHorizontal : 0,
      selectedCell : null,
      selectedCellEditing : false,
      //needed for multilanguage cell selection
      expandedRowIds : null, //Array
      selectedCellExpandedRow : null,
      shouldCellFocus : true,
      rowContextMenu : null
    }
  },

  /*shouldComponentUpdate  (nextProps, nextState) {
   if (_.isEqual(nextProps, this.props) && _.isEqual(nextState, this.state)) {
   console.log("###### Table Props are equal. dont update.");
   return false;
   } else {
   return true;
   }
   },*/

  componentWillMount() {
    var self = this;
    Dispatcher.on(ActionTypes.TOGGLE_CELL_SELECTION, this.toggleCellSelection);
    Dispatcher.on(ActionTypes.TOGGLE_CELL_EDITING, this.toggleCellEditing);
    Dispatcher.on(ActionTypes.SELECT_NEXT_CELL, this.setNextSelectedCell);
    Dispatcher.on(ActionTypes.TOGGLE_ROW_EXPAND, this.toggleRowExpand);
    Dispatcher.on(ActionTypes.CREATE_ROW_OR_SELECT_NEXT_CELL, this.createRowOrSelectNext);
    Dispatcher.on(ActionTypes.DISABLE_SHOULD_CELL_FOCUS, this.disableShouldCellFocus);
    Dispatcher.on(ActionTypes.ENABLE_SHOULD_CELL_FOCUS, this.enableShouldCellFocus);
    Dispatcher.on(ActionTypes.SHOW_ROW_CONTEXT_MENU, this.showRowContextMenu);
    Dispatcher.on(ActionTypes.CLOSE_ROW_CONTEXT_MENU, this.closeRowContextMenu);
    Dispatcher.on(ActionTypes.DUPLICATE_ROW, this._duplicateRow);

    window.addEventListener("resize", this.windowResize);
    this.props.rows.on("add", self.rowAdded);
  },
  componentDidMount() {
    this.tableRowsDom = ReactDOM.findDOMNode(this.refs.tableRows);
    this.columnsDom = ReactDOM.findDOMNode(this.refs.columns);
    this.setState({offsetTableData : this.tableRowsDom.getBoundingClientRect().top});
    //Don't change this to state, its more performant during scroll
    this.headerDOMElement = document.getElementById(this.tableHeaderId);
    this.tableDOMNode = ReactDOM.findDOMNode(this);
    this.tableDOMOffsetY = this.tableDOMNode.getBoundingClientRect().top;
  },

  componentDidUpdate() {
    console.log("Table did update.");
    //When overlay is open we don't want anything to force focus inside the table
    if (!this.props.overlayOpen) {
      //Just update when used with keyboard or when clicking explicitly on a cell
      if (this.shouldCellFocus()) {
        this.updateScrollViewToSelectedCell();
      }
      this.checkFocusInsideTable();
    }
  },

  componentWillUnmount() {
    Dispatcher.off(ActionTypes.TOGGLE_CELL_SELECTION, this.toggleCellSelection);
    Dispatcher.off(ActionTypes.TOGGLE_CELL_EDITING, this.toggleCellEditing);
    Dispatcher.off(ActionTypes.SELECT_NEXT_CELL, this.setNextSelectedCell);
    Dispatcher.off(ActionTypes.TOGGLE_ROW_EXPAND, this.toggleRowExpand);
    Dispatcher.off(ActionTypes.CREATE_ROW_OR_SELECT_NEXT_CELL, this.createRowOrSelectNext);
    Dispatcher.off(ActionTypes.DISABLE_SHOULD_CELL_FOCUS, this.disableShouldCellFocus);
    Dispatcher.off(ActionTypes.ENABLE_SHOULD_CELL_FOCUS, this.enableShouldCellFocus);
    Dispatcher.off(ActionTypes.SHOW_ROW_CONTEXT_MENU, this.showRowContextMenu);
    Dispatcher.off(ActionTypes.CLOSE_ROW_CONTEXT_MENU, this.closeRowContextMenu);
    Dispatcher.off(ActionTypes.DUPLICATE_ROW, this._duplicateRow);

    window.removeEventListener("resize", this.windowResize);
    this.props.table.rows.off("add", this.rowAdded);
  },

  showRowContextMenu(payload) {
    this.setState({
      rowContextMenu : payload
    });
  },

  closeRowContextMenu(payload) {
    console.log("closeRowContextMenu", payload);
    this.setState({
      rowContextMenu : null
    });
  },

  getRowContextMenu() {
    const {rowContextMenu} = this.state;
    if (rowContextMenu !== null) {
      return <RowContextMenuWithClickOutside
        {...rowContextMenu}
        onClickOutside={()=>{this.setState({rowContextMenu : null})}}
        offsetY={this.tableDOMOffsetY}/>
    } else {
      return null;
    }
  },

  disableShouldCellFocus() {
    if (this.state.shouldCellFocus) {
      console.log("Table.disableShouldCellFocus");
      this.setState({shouldCellFocus : false});
    }
  },

  enableShouldCellFocus() {
    if (!this.state.shouldCellFocus) {
      console.log("Table.enableShouldCellFocus");
      this.setState({shouldCellFocus : true});
    }
  },

  shouldCellFocus() {
    //we dont want to force cell focus when overlay is open
    return this.state.shouldCellFocus && !this.props.overlayOpen;
  },

  //Takes care that we never loose focus of the table to guarantee keyboard events are triggered
  checkFocusInsideTable() {
    //Is a cell selected?
    if (this.state.selectedCell !== null) {
      var tableDOMNode = this.tableDOMNode;
      var focusedElement = document.activeElement;
      //happens in IE
      if (focusedElement === null) {
        tableDOMNode.focus();
      } else if (!tableDOMNode.contains(focusedElement)) {
        //Is the focus outside the table or is body selected
        //force table to be focused to get keyboard events
        tableDOMNode.focus();
      }
    }
  },

  /**
   * Checks if selected cell is overflowing and adjusts the scroll position
   * This enhances the default browser behaviour because it checks if the selected cell is completely visible.
   */
  updateScrollViewToSelectedCell() {
    console.log("Scroll View Update happens.");
    //Scrolling container
    var tableRowsDom = this.tableRowsDom;
    //Are there any selected cells?
    var cellsDom = tableRowsDom.getElementsByClassName("cell selected");
    if (cellsDom.length > 0) {
      //Get the first selected cell
      var cell = cellsDom[0];
      //Cell DOM position and dimensions
      var targetY = cell.offsetTop;
      var targetX = cell.offsetLeft;
      var cellWidth = cell.offsetWidth;
      var cellHeight = cell.offsetHeight;
      //Scroll container position and dimensions
      var currentScrollPositionX = tableRowsDom.scrollLeft;
      var currentScrollPositionY = tableRowsDom.scrollTop;
      var containerWidth = tableRowsDom.clientWidth;
      var containerHeight = tableRowsDom.clientHeight;

      //Check if cell is outside the view. Cell has to be completely visible
      if (targetX < currentScrollPositionX) {
        //Overflow Left
        tableRowsDom.scrollLeft = targetX;

      } else if (targetX + cellWidth > currentScrollPositionX + containerWidth) {
        //Overflow Right
        tableRowsDom.scrollLeft = targetX - (containerWidth - cellWidth);
      }

      if (targetY < currentScrollPositionY) {
        //Overflow Top
        tableRowsDom.scrollTop = targetY;

      } else if (targetY + cellHeight > currentScrollPositionY + containerHeight) {
        //Overflow Bottom
        tableRowsDom.scrollTop = targetY - (containerHeight - cellHeight);
      }
    }
  },

  rowAdded() {
    if (this.selectNewCreatedRow) {
      this.selectNewCreatedRow = false;
      this.setNextSelectedCell(Directions.DOWN);
    }
  },

  _duplicateRow(payload){
    duplicateRow.call(this, payload);
  },

  isLastRowSelected() {
    var rows = this.props.rows;
    var numberOfRows = rows.length;
    var currentRowId = this.getCurrentSelectedRowId();
    var lastRowId;
    if (numberOfRows <= 0) {
      return true;
    }
    lastRowId = rows.at(numberOfRows - 1).getId();
    return (currentRowId === lastRowId);
  },

  createRowOrSelectNext() {
    if (this.isLastRowSelected()) {
      this.selectNewCreatedRow = true;
      ActionCreator.addRow(this.props.table.id);
    } else {
      this.setNextSelectedCell(Directions.DOWN);
    }
  },

  toggleRowExpand  (payload) {
    var toggleRowId = payload.rowId;
    var newExpandedRowIds = _.clone(this.state.expandedRowIds) || [];
    var rowIdExists = false;

    newExpandedRowIds.forEach((rowId, index)=> {
      if (rowId === toggleRowId) {
        //already expanded: remove to close expanding row
        newExpandedRowIds.splice(index, 1);
        rowIdExists = true;
      }
    });

    // expand this row
    if (!rowIdExists) {
      newExpandedRowIds.push(toggleRowId);
    }

    this.setState({
      expandedRowIds : newExpandedRowIds
    });

  },

  toggleCellSelection  (params) {
    this.setState({
      selectedCell : params.cell,
      selectedCellEditing : false,
      selectedCellExpandedRow : params.langtag || null
    });
  },

  toggleCellEditing  (params) {
    var editVal = (!_.isUndefined(params) && !_.isUndefined(params.editing)) ? params.editing : true;
    var selectedCell = this.state.selectedCell;
    if (selectedCell) {
      var noEditingModeNeeded = (selectedCell.kind === ColumnKinds.boolean || selectedCell.kind === ColumnKinds.link);
      if (!noEditingModeNeeded) {
        this.setState({
          selectedCellEditing : editVal
        });
      }
    }
  },

  setNextSelectedCell  (direction) {

    if (!this.state.selectedCell) {
      return;
    }

    var self = this;
    var row;
    var nextCellId;

    var rowCell = {
      id : self.getCurrentSelectedRowId(),
      selectedCellExpandedRow : this.props.langtag
    };
    var columnCell = {
      id : self.getCurrentSelectedColumnId(),
      selectedCellExpandedRow : this.props.langtag
    };
    var newSelectedCellExpandedRow; //Either row or column switch changes the selected language

    switch (direction) {
      case Directions.LEFT:
        columnCell = self.getPreviousColumn(self.getCurrentSelectedColumnId());
        newSelectedCellExpandedRow = columnCell.selectedCellExpandedRow;
        break;

      case Directions.RIGHT:
        columnCell = self.getNextColumnCell(self.getCurrentSelectedColumnId());
        newSelectedCellExpandedRow = columnCell.selectedCellExpandedRow;
        break;

      case Directions.UP:
        rowCell = self.getPreviousRow(self.getCurrentSelectedRowId());
        newSelectedCellExpandedRow = rowCell.selectedCellExpandedRow;
        break;

      case Directions.DOWN:
        rowCell = self.getNextRowCell(self.getCurrentSelectedRowId());
        newSelectedCellExpandedRow = rowCell.selectedCellExpandedRow;
        break;
    }

    row = self.props.table.rows.get(rowCell.id);
    nextCellId = 'cell-' + self.props.table.getId() + '-' + columnCell.id + '-' + rowCell.id;
    if (row) {
      var nextCell = row.cells.get(nextCellId);
      if (nextCell) {
        this.toggleCellSelection({
          cell : nextCell,
          langtag : newSelectedCellExpandedRow
        });
      }
    }
  },

  //returns the next row and the next language cell when expanded
  getNextRowCell  (currentRowId, getPrev) {
    var rows = this.props.rows;
    var currentRow = rows.get(currentRowId);
    var indexCurrentRow = rows.indexOf(currentRow);
    var numberOfRows = rows.length;
    var expandedRowIds = this.state.expandedRowIds;
    var selectedCellExpandedRow = this.state.selectedCellExpandedRow;
    var nextSelectedCellExpandedRow;
    var nextIndex = getPrev ? indexCurrentRow - 1 : indexCurrentRow + 1;
    var nextRowIndex;
    var nextRowId;
    var jumpToNextRow = false;

    //are there expanded rows and is current selection inside of expanded row block
    if (expandedRowIds && expandedRowIds.length > 0 && expandedRowIds.indexOf(currentRowId) > -1) {
      //get next (lower / upper) language position
      var nextLangtagIndex = App.langtags.indexOf(selectedCellExpandedRow) + (getPrev ? -1 : 1);
      //jump to new language inside expanded row - but just when cell is multilanguage
      if (nextLangtagIndex >= 0 && nextLangtagIndex <= App.langtags.length - 1 && this.state.selectedCell.isMultiLanguage) {
        //keep the row
        nextIndex = indexCurrentRow;
        //set new language
        nextSelectedCellExpandedRow = App.langtags[nextLangtagIndex];
      }
      //jump from expanded row to next / or previous cell (completely new row)
      else {
        jumpToNextRow = true;
      }
    }
    //current row is not expanded so jump to next row
    else {
      jumpToNextRow = true;
    }

    //Get the next row id
    nextRowIndex = Math.max(0, Math.min(nextIndex, numberOfRows - 1));
    nextRowId = rows.at(nextRowIndex).getId();

    if (jumpToNextRow) {
      //Next row is expanded
      if (this.state.expandedRowIds && this.state.expandedRowIds.indexOf(nextRowId) > -1) {
        //Multilanguage cell
        if (this.state.selectedCell.isMultiLanguage) {
          nextSelectedCellExpandedRow = getPrev ? App.langtags[App.langtags.length - 1] : App.langtags[0];
        }
        //Skip single language cell to next editable cell - by default the first language
        else {
          nextSelectedCellExpandedRow = App.langtags[0];
        }
      }
      //Next row is closed row. Set default language
      else {
        nextSelectedCellExpandedRow = this.props.langtag;
      }
    }

    return {
      id : nextRowId,
      selectedCellExpandedRow : nextSelectedCellExpandedRow
    };

  },

  getPreviousRow  (currentRowId) {
    return this.getNextRowCell(currentRowId, true);
  }
  ,

  getNextColumnCell  (currenColumnId, getPrev) {
    var self = this;
    var currentColumn = this.props.table.columns.get(currenColumnId);
    var indexCurrentColumn = this.props.table.columns.indexOf(currentColumn);
    var numberOfColumns = this.props.table.columns.length;
    var nextIndex = getPrev ? indexCurrentColumn - 1 : indexCurrentColumn + 1;
    var nextColumnIndex = Math.max(0, Math.min(nextIndex, numberOfColumns - 1));
    var nextColumn = this.props.table.columns.at(nextColumnIndex);
    var nextColumnId = nextColumn.getId();
    var currentSelectedRowId = this.state.selectedCell.rowId;
    var newSelectedCellExpandedRow;

    //Not Multilanguage and row is expanded so jump to top language
    if (!nextColumn.multilanguage && this.state.expandedRowIds && this.state.expandedRowIds.indexOf(currentSelectedRowId) > -1) {
      newSelectedCellExpandedRow = App.langtags[0];
    } else {
      newSelectedCellExpandedRow = self.state.selectedCellExpandedRow;
    }

    return {
      id : nextColumnId,
      selectedCellExpandedRow : newSelectedCellExpandedRow
    };
  }
  ,

  getPreviousColumn(currentColumnId) {
    return this.getNextColumnCell(currentColumnId, true);
  }
  ,

  getKeyboardShortcuts() {
    var self = this;

    //Force the next selected cell to be focused
    if (!this.shouldCellFocus()) {
      this.enableShouldCellFocus();
    }
    return {
      left(event) {
        event.preventDefault();
        self.preventSleepingOnTheKeyboard(() => {
            self.setNextSelectedCell(Directions.LEFT);
          }
        );
      },
      right(event) {
        event.preventDefault();
        self.preventSleepingOnTheKeyboard(() => {
            self.setNextSelectedCell(Directions.RIGHT);
          }
        );
      },
      tab(event) {
        event.preventDefault();
        self.preventSleepingOnTheKeyboard(() => {
            self.setNextSelectedCell(Directions.RIGHT);
          }
        );
      },
      up(event) {
        event.preventDefault();
        self.preventSleepingOnTheKeyboard(() => {
            self.setNextSelectedCell(Directions.UP);
          }
        );
      },
      down(event) {
        event.preventDefault();
        self.preventSleepingOnTheKeyboard(() => {
            self.setNextSelectedCell(Directions.DOWN);
          }
        );
      },
      enter(event) {
        event.preventDefault();
        self.preventSleepingOnTheKeyboard(() => {
            if (self.state.selectedCell && !self.state.selectedCellEditing) {
              self.toggleCellEditing();
            }
          }
        );
      },
      escape(event) {
        event.preventDefault();
        self.preventSleepingOnTheKeyboard(() => {
            if (self.state.selectedCell && self.state.selectedCellEditing) {
              self.toggleCellEditing({editing : false});
            }
          }
        );
      },
      text(event) {
        if (self.state.selectedCell && !self.state.selectedCellEditing
          && (self.state.selectedCell.kind === ColumnKinds.text
          || self.state.selectedCell.kind === ColumnKinds.shorttext
          || self.state.selectedCell.kind === ColumnKinds.numeric)) {
          self.toggleCellEditing();
        }
      }
    };
  },

  /**
   * Helper to prevent massive events on pressing navigation keys for changing cell selections
   * @param cb
   */
  preventSleepingOnTheKeyboard(cb) {
    var self = this;
    if (this.keyboardRecentlyUsedTimer === null) {
      this.keyboardRecentlyUsedTimer = setTimeout(()=> {
        self.keyboardRecentlyUsedTimer = null;
      }, 100);
      cb();
    }
  },

  getCurrentSelectedRowId() {
    return this.state.selectedCell ? this.state.selectedCell.rowId : 0;
  },

  getCurrentSelectedColumnId() {
    return this.state.selectedCell ? this.state.selectedCell.column.getId() : 0;
  },

  handleClickOutside(event) {
    /*
     Prevent to render when clicking on already selected cell and don't clear when some cell is editing. This way cells
     like shorttext will be saved on the first click outside and on the second click it gets deselected.
     */
    if (this.state.selectedCell && !this.state.selectedCellEditing) {
      this.setState({
        selectedCell : null
      });
    }
  },

  handleScroll(e) {
    //only when horizontal scroll changed
    if (e.target.scrollLeft != this.scrolledXBefore) {
      var scrolledX = e.target.scrollLeft;
      //Don't change this to state, its more performant during scroll
      this.headerDOMElement.style.left = -scrolledX + "px";
      this.scrolledXBefore = scrolledX;
    }
  },

  /**
   * The cleaner function but costs more performance when scrolling on IE or Mac with Retina
   */
  /*handleScrollReact  (e) {
   var scrolledX = e.target.scrollLeft;
   this.setState({scrolledHorizontal : scrolledX});
   },*/

  windowResize() {
    this.setState({windowHeight : window.innerHeight});
  },

  tableDataHeight() {
    return (this.state.windowHeight - this.state.offsetTableData);
  },

  onMouseDownHandler(e) {
    //We don't prevent mouse down behaviour when focus is outside of table. This fixes the issue to close select boxes in the header
    if (this.tableDOMNode.contains(document.activeElement)) {
      console.log("onMouseDown", e.target);
      //deselect a cell when clicking in white area of table or the column
      if (e.target === this.tableRowsDom || this.columnsDom.contains(e.target)) {
        this.handleClickOutside(e);
      }

      /*
       Important: prevents loosing the focus of a cell when clicking something.
       When a child component inside of the Table needs focus attach a "onMouseDown" event to it and
       call "event.stopPropagation()". This prevents calling this function and enables the standard browser behaviour
       */
      e.preventDefault();
    }
  },

  render() {
    console.log("Rendering table");
    return (
      <section id="table-wrapper" ref="tableWrapper" tabIndex="-1" onScroll={this.handleScroll}
               onKeyDown={KeyboardShortcutsHelper.onKeyboardShortcut(this.getKeyboardShortcuts)}
               onMouseDown={this.onMouseDownHandler}>
        <div className="tableaux-table" ref="tableInner">
          <Columns ref="columns" langtag={this.props.langtag} columns={this.props.table.columns}/>
          <Rows ref="tableRows"
                rowsHeight={this.tableDataHeight()}
                rows={this.props.rows}
                langtag={this.props.langtag}
                selectedCell={this.state.selectedCell}
                selectedCellEditing={this.state.selectedCellEditing}
                expandedRowIds={this.state.expandedRowIds}
                selectedCellExpandedRow={this.state.selectedCellExpandedRow}
                table={this.props.table}
                shouldCellFocus={this.shouldCellFocus()}
          />
        </div>
        {this.getRowContextMenu()}
      </section>
    );
  }
});

module.exports = Table;
