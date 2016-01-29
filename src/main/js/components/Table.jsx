var React = require('react');
var ReactDOM = require('react-dom');
var _ = require('lodash');
var App = require('ampersand-app');
var AmpersandMixin = require('ampersand-react-mixin');
var Dispatcher = require('../dispatcher/Dispatcher');
var Columns = require('./columns/Columns.jsx');
var Rows = require('./rows/Rows.jsx');
var KeyboardShortcutsMixin = require('./mixins/KeyboardShortcutsMixin');
var OutsideClick = require('react-onclickoutside');

var Table = React.createClass({
  mixins : [AmpersandMixin, KeyboardShortcutsMixin, OutsideClick],

  displayName : 'Table',

  propTypes : {
    langtag : React.PropTypes.string.isRequired,
    table : React.PropTypes.object.isRequired
  },

  /**
   * This is an anti-patter on purpose
   * Don't change this, its more performant than using this.state !
   */
  headerDOMElement : null,
  scrolledXBefore : 0,

  //Internal state values
  keyboardRecentlyUsedTimer : null,

  getInitialState : function () {
    return {
      offsetTableData : 0,
      windowHeight : window.innerHeight,
      scrolledHorizontal : 0,
      selectedCell : null,
      selectedCellEditing : false,
      //needed for multilanguage cell selection
      expandedRowIds : null, //Array
      selectedCellExpandedRow : null,
      shouldCellFocus : true
    }
  },

  /*shouldComponentUpdate : function (nextProps, nextState) {
   if (_.isEqual(nextProps, this.props) && _.isEqual(nextState, this.state)) {
   console.log("###### Table Props are equal. dont update.");
   return false;
   } else {
   return true;
   }
   },*/

  componentWillUpdate : function (nextProps, nextState) {
    console.log("this.state.selectedCell", this.state.selectedCell);
    console.log("nextState.selectedCell", nextState.selectedCell);
  },

  componentWillMount : function () {
    var table = this.props.table;
    //We need to fetch columns first, since rows has Cells that depend on the column model
    table.columns.fetch({
      success : function () {
        table.rows.fetch({
          success : function () {
            console.log("table columns & rows fetched successfully.");
          }
        });
      }
    });
  },

  componentDidMount : function () {
    this.setState({offsetTableData : ReactDOM.findDOMNode(this.refs.tableRows).getBoundingClientRect().top});
    //Don't change this to state, its more performant during scroll
    this.headerDOMElement = document.getElementById("tableHeader");
    window.addEventListener("resize", this.windowResize);
    Dispatcher.on('toggleCellSelection', this.toggleCellSelection);
    Dispatcher.on('toggleCellEditing', this.toggleCellEditing);
    Dispatcher.on('selectNextCell', this.setNextSelectedCell);
    Dispatcher.on('toggleRowExpand', this.toggleRowExpand);
    Dispatcher.on('createRowOrSelectNext', this.createRowOrSelectNext);
    Dispatcher.on('allowScrollViewUpdate', this.allowScrollViewUpdate);
    Dispatcher.on('disableShouldCellFocus', this.disableShouldCellFocus);
    Dispatcher.on('enableShouldCellFocus', this.enableShouldCellFocus);
  },

  componentDidUpdate : function () {
    console.log("Table did update.");
    //Just update when used with keyboard or when clicking explicitly on a cell
    if (this.state.shouldCellFocus) {
      this.updateScrollViewToSelectedCell();
    }
  },

  componentWillUnmount : function () {
    window.removeEventListener("resize", this.windowResize);
    Dispatcher.off('toggleCellSelection', this.toggleCellSelection);
    Dispatcher.off('toggleCellEditing', this.toggleCellEditing);
    Dispatcher.off('selectNextCell', this.setNextSelectedCell);
    Dispatcher.off('toggleRowExpand', this.toggleRowExpand);
    Dispatcher.off('createRowOrSelectNext', this.createRowOrSelectNext);
    Dispatcher.off('allowScrollViewUpdate', this.allowScrollViewUpdate);
    Dispatcher.off('disableShouldCellFocus', this.disableShouldCellFocus);
    Dispatcher.off('enableShouldCellFocus', this.enableShouldCellFocus);
  },

  disableShouldCellFocus : function () {
    if (this.state.shouldCellFocus) {
      console.log("Table.disableShouldCellFocus");
      this.setState({shouldCellFocus : false});
    }
  },

  enableShouldCellFocus : function () {
    if (!this.state.shouldCellFocus) {
      console.log("Table.enableShouldCellFocus");
      this.setState({shouldCellFocus : true});
    }
  },

  /**
   * Checks if selected cell is overflowing and adjusts the scroll position
   * This enhances the default browser behaviour because it checks if the selected cell is completely visible.
   */
  updateScrollViewToSelectedCell : function () {
    console.log("Scroll View Update happens.");
    //Scrolling container
    var tableRowsDom = ReactDOM.findDOMNode(this.refs.tableRows);
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

  createRowOrSelectNext : function () {
    var self = this;
    if (self.isLastRow()) {
      Dispatcher.trigger('add-row:' + self.props.table.id, function (error) {
        if (!error) {
          self.setNextSelectedCell("down");
        } else {
          console.error("Error adding row: ", error);
        }
      });
    } else {
      self.setNextSelectedCell("down");
    }
  },

  toggleRowExpand : function (row) {
    var toggleRowId = row.id;
    var newExpandedRowIds = _.clone(this.state.expandedRowIds) || [];
    var rowIdExists = false;

    newExpandedRowIds.forEach(function (rowId, index) {
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

  toggleCellSelection : function (params) {
    console.log("Table.toggleCellSelection: selecting:", params);
    this.setState({
      selectedCell : params.cell,
      selectedCellEditing : false,
      selectedCellExpandedRow : params.langtag || null
    });
    this.allowScrollViewUpdate();
  },

  toggleCellEditing : function (params) {
    var editVal = params.editing;
    var selectedCell = this.state.selectedCell;
    if (selectedCell) {
      var noEditingModeNeeded = (selectedCell.kind === "boolean" || selectedCell.kind === "link");
      if (!noEditingModeNeeded) {
        this.setState({
          selectedCellEditing : !_.isUndefined(editVal) ? editVal : true
        });
      }
    }
  },

  setNextSelectedCell : function (direction) {
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
      case "left":
        columnCell = self.getPreviousColumn(self.getCurrentSelectedColumnId());
        newSelectedCellExpandedRow = columnCell.selectedCellExpandedRow;
        break;

      case "right":
        columnCell = self.getNextColumnCell(self.getCurrentSelectedColumnId());
        newSelectedCellExpandedRow = columnCell.selectedCellExpandedRow;
        break;

      case "up":
        rowCell = self.getPreviousRow(self.getCurrentSelectedRowId());
        newSelectedCellExpandedRow = rowCell.selectedCellExpandedRow;
        break;

      case "down":
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

  isLastRow : function () {
    var numberOfRows = this.props.table.rows.length;
    var currentRowId = this.getCurrentSelectedRowId();
    var lastRowId;
    if (numberOfRows <= 0) {
      return true;
    }
    lastRowId = this.props.table.rows.at(numberOfRows - 1).getId();
    return (currentRowId === lastRowId);
  },

  //returns the next row and the next language cell when expanded
  getNextRowCell : function (currentRowId, getPrev) {
    var currentRow = this.props.table.rows.get(currentRowId);
    var indexCurrentRow = this.props.table.rows.indexOf(currentRow);
    var numberOfRows = this.props.table.rows.length;
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
    nextRowId = this.props.table.rows.at(nextRowIndex).getId();

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

  getPreviousRow : function (currentRowId) {
    return this.getNextRowCell(currentRowId, true);
  }
  ,

  getNextColumnCell : function (currenColumnId, getPrev) {
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

  getPreviousColumn : function (currenColumnId) {
    return this.getNextColumnCell(currenColumnId, true);
  }
  ,

  getKeyboardShortcuts : function () {
    var self = this;

    //Force the next selected cell to be focused
    if (!this.state.shouldCellFocus) {
      this.enableShouldCellFocus();
    }
    return {
      left : function (event) {
        event.preventDefault();
        self.preventSleepingOnTheKeyboard(
          function () {
            self.allowScrollViewUpdate();
            self.setNextSelectedCell("left");
          }
        );
      },
      right : function (event) {
        event.preventDefault();
        self.preventSleepingOnTheKeyboard(
          function () {
            self.allowScrollViewUpdate();
            self.setNextSelectedCell("right");
          }
        );
      },
      tab : function (event) {
        event.preventDefault();
        self.preventSleepingOnTheKeyboard(
          function () {
            self.allowScrollViewUpdate();
            self.setNextSelectedCell("right");
          }
        );
      },
      up : function (event) {
        event.preventDefault();
        self.preventSleepingOnTheKeyboard(
          function () {
            self.allowScrollViewUpdate();
            self.setNextSelectedCell("up");
          }
        );
      },
      down : function (event) {
        event.preventDefault();
        self.preventSleepingOnTheKeyboard(
          function () {
            self.allowScrollViewUpdate();
            self.setNextSelectedCell("down");
          }
        );
      },
      enter : function (event) {
        event.preventDefault();
        self.preventSleepingOnTheKeyboard(
          function () {
            console.log("Enter Table cellEditing, event: ", event);
            if (self.state.selectedCell && !self.state.selectedCellEditing) {
              self.toggleCellEditing({cell : self.state.selectedCell});
            }
          }
        );
      },
      escape : function (event) {
        event.preventDefault();
        self.preventSleepingOnTheKeyboard(
          function () {
            if (self.state.selectedCell && self.state.selectedCellEditing) {
              self.toggleCellEditing({editing : false});
            }
          }
        );
      },
      text : function (event) {
        if (self.state.selectedCell && !self.state.selectedCellEditing
          && (self.state.selectedCell.kind === "text" || self.state.selectedCell.kind === "shorttext" || self.state.selectedCell.kind === "numeric")) {
          self.toggleCellEditing({cell : self.state.selectedCell});
        }
      }
    };
  },

  /**
   * Helper to prevent massive events on pressing navigation keys for changing cell selections
   * @param cb
   */
  preventSleepingOnTheKeyboard : function (cb) {
    var self = this;
    if (this.keyboardRecentlyUsedTimer === null) {
      this.keyboardRecentlyUsedTimer = setTimeout(function () {
        self.keyboardRecentlyUsedTimer = null;
      }, 100);
      cb();
    }
  },

  allowScrollViewUpdate : function () {
    this.canUpdateScrollView = true;
  },

  getCurrentSelectedRowId : function () {
    return this.state.selectedCell ? this.state.selectedCell.rowId : 0;
  },

  getCurrentSelectedColumnId : function () {
    return this.state.selectedCell ? this.state.selectedCell.column.getId() : 0;
  },

  handleClickOutside : function (event) {
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

  handleScroll : function (e) {
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
  /*handleScrollReact : function (e) {
   var scrolledX = e.target.scrollLeft;
   this.setState({scrolledHorizontal : scrolledX});
   },*/

  windowResize : function () {
    this.setState({windowHeight : window.innerHeight});
  },

  tableDataHeight : function () {
    return (this.state.windowHeight - this.state.offsetTableData);
  },

  onMouseDownHandler : function (e) {
    /*
     Important: prevents loosing the focus of a cell when clicking something.
     When a child component inside of the Table needs focus attach a "onMouseDown" event to it and
     call "event.stopPropagation()". This prevents calling this function and enables the standard browser behaviour
     */
    e.preventDefault();
  },

  render : function () {
    console.log(">>>>> Rendering Table <<<<<<");
    return (
      <section id="table-wrapper" ref="tableWrapper" onScroll={this.handleScroll} onKeyDown={this.onKeyboardShortcut}
               onMouseDown={this.onMouseDownHandler}>
        <div className="tableaux-table" ref="tableInner">
          <Columns ref="columns" columns={this.props.table.columns}/>
          <Rows ref="tableRows"
                rowsHeight={this.tableDataHeight()}
                rows={this.props.table.rows}
                langtag={this.props.langtag}
                selectedCell={this.state.selectedCell}
                selectedCellEditing={this.state.selectedCellEditing}
                expandedRowIds={this.state.expandedRowIds}
                selectedCellExpandedRow={this.state.selectedCellExpandedRow}
                table={this.props.table}
                shouldCellFocus={this.state.shouldCellFocus}
                onClick={this.onClickedTableElement}
          />
        </div>
      </section>
    );
  }
});

module.exports = Table;
