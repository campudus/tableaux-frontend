var React = require('react');
var ReactDOM = require('react-dom');
var _ = require('lodash');
var App = require('ampersand-app');
var AmpersandMixin = require('ampersand-react-mixin');
var Dispatcher = require('../dispatcher/Dispatcher');
var Columns = require('./columns/Columns.jsx');
var Rows = require('./rows/Rows.jsx');
var NewRow = require('./rows/NewRow.jsx');
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

  getInitialState : function () {
    return {
      offsetTableData : 0,
      windowHeight : window.innerHeight,
      scrolledHorizontal : 0,
      selectedCell : null,
      selectedCellEditing : false,
      //needed for multilanguage cell selection
      expandedRowIds : null, //Array
      selectedCellExpandedRow : null
    }
  },

  componentWillMount : function () {
    var table = this.props.table;
    table.columns.fetch({
      success : function () {
        table.rows.fetch();
      }
    });
  },

  componentDidMount : function () {
    this.setState({offsetTableData : ReactDOM.findDOMNode(this.refs.dataWrapper).getBoundingClientRect().top});
    //Don't change this to state, its more performant during scroll
    this.headerDOMElement = document.getElementById("tableHeader");
    window.addEventListener("resize", this.windowResize);
    document.addEventListener('keydown', this.onKeyboardShortcut);
    Dispatcher.on('toggleCellSelection', this.toggleCellSelection);
    Dispatcher.on('toggleCellEditing', this.toggleCellEditing);
    Dispatcher.on('selectNextCell', this.setNextSelectedCell);
    Dispatcher.on('toggleRowExpand', this.toggleRowExpand);
    Dispatcher.on('createRowOrSelectNext', this.createRowOrSelectNext);
  },

  componentWillUnmount : function () {
    window.removeEventListener("resize", this.windowResize);
    Dispatcher.off('toggleCellSelection', this.toggleCellSelection);
    Dispatcher.off('toggleCellEditing', this.toggleCellEditing);
    Dispatcher.off('selectNextCell', this.setNextSelectedCell);
    Dispatcher.off('toggleRowExpand', this.toggleRowExpand);
    Dispatcher.off('createRowOrSelectNext', this.createRowOrSelectNext);
    document.removeEventListener('keydown', this.onKeyboardShortcut);
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
  },

  toggleCellEditing : function (params) {

    var editVal = params.editing;
    if (!this.state.selectedCell) {
      return;
    }

    var noEditingModeNeeded = (params.cell.kind === "boolean");
    if (!noEditingModeNeeded && params.cell.getId() === this.state.selectedCell.getId()) {
      this.setState({
        selectedCellEditing : !_.isUndefined(editVal) ? editVal : true
      })
    }

  },

  setNextSelectedCell : function (direction) {
    //TODO: Ignore keyDowns when overlay is open
    //ignore all direction key shortcuts when in editing mode
    if (this.state.selectedCellEditing) {
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
      var nextCell = _.find(row.cells, 'id', nextCellId);
      if (nextCell) {
        console.log("setNextSelectedCell setState:", nextCell, " language ", newSelectedCellExpandedRow);
        self.setState({
          selectedCell : nextCell,
          selectedCellExpandedRow : newSelectedCellExpandedRow
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
    return {

      left : function (event) {
        self.setNextSelectedCell("left");
      },

      right : function (event) {
        self.setNextSelectedCell("right");
      },

      tab : function (event) {
        event.preventDefault(); //prevent browser focus of next link element
        self.setNextSelectedCell("right");
      },

      up : function () {
        self.setNextSelectedCell("up");
      },

      down : function () {
        self.setNextSelectedCell("down");
      },

      enter : function (event) {
        console.log("Enter Table cellEditing, event: ", event);
        //avoids adding line break to text cell
        event.preventDefault();
        if (self.state.selectedCell && !self.state.selectedCellEditing) {
          self.toggleCellEditing({cell : self.state.selectedCell});
        }
      },

      escape : function (event) {
        console.log("escape pressed");
        if (self.state.selectedCell && self.state.selectedCellEditing) {
          self.toggleCellEditing({cell : self.state.selectedCell, editing : false});
        }
      },

      text : function (event) {
        if (self.state.selectedCell && !self.state.selectedCellEditing) {
          self.toggleCellEditing({cell : self.state.selectedCell});
        }
      }

    };
  },

  getCurrentSelectedRowId : function () {
    return this.state.selectedCell ? this.state.selectedCell.rowId : 0;
  },

  getCurrentSelectedColumnId : function () {
    return this.state.selectedCell ? this.state.selectedCell.column.getId() : 0;
  },

  handleClickOutside : function (event) {
    if (!this.state.selectedCellEditing) {
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
    return {height : (this.state.windowHeight - this.state.offsetTableData) + "px"};
  },

  render : function () {
    return (
      <section id="table-wrapper" ref="tableWrapper" onScroll={this.handleScroll}>
        <div className="tableaux-table" ref="tableInner">
          <Columns ref="columns" columns={this.props.table.columns}/>
          <div ref="dataWrapper" className="data-wrapper" style={ this.tableDataHeight() }>
            <Rows rows={this.props.table.rows} langtag={this.props.langtag} selectedCell={this.state.selectedCell}
                  selectedCellEditing={this.state.selectedCellEditing} expandedRowIds={this.state.expandedRowIds}
                  selectedCellExpandedRow={this.state.selectedCellExpandedRow}/>
            <NewRow table={this.props.table} langtag={this.props.langtag}/>
          </div>
        </div>
      </section>
    );
  }
});

module.exports = Table;
