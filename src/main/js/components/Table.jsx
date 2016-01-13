var React = require('react');
var ReactDOM = require('react-dom');
var _ = require('lodash');
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
      selectedCellEditing : false
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
  },

  componentWillUnmount : function () {
    window.removeEventListener("resize", this.windowResize);
    Dispatcher.off('toggleCellSelection', this.toggleCellSelection);
    Dispatcher.off('toggleCellEditing', this.toggleCellEditing);
    Dispatcher.off('selectNextCell', this.setNextSelectedCell);
    document.removeEventListener('keydown', this.onKeyboardShortcut);
  },

  toggleCellSelection : function (params) {
    console.log("toggleCellSelection: I want to select ", params.cell.column.getId(), " ", params.cell.rowId);
    this.setState({
      selectedCell : params.cell,
      selectedCellEditing : false
    });
  },

  toggleCellEditing : function (params) {

    var editVal = params.editing;
    if (!this.state.selectedCell) {
      return;
    }

    var noEditingModeNeeded = params.cell.kind === "boolean";
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
    var rowId = self.getCurrentSelectedRowId();
    var columnId = self.getCurrentSelectedColumnId();

    switch (direction) {
      case "left":
        columnId = self.getPreviousColumnId(columnId);
        break;

      case "right":
        columnId = self.getNextColumnId(columnId);
        break;

      case "up":
        rowId = self.getPreviousRowId(rowId);
        break;

      case "down":
        rowId = self.getNextRowId(rowId);
        break;
    }

    row = self.props.table.rows.get(rowId);
    nextCellId = 'cell-' + self.props.table.getId() + '-' + columnId + '-' + rowId;

    if (row) {
      var nextCell = _.find(row.cells, 'id', nextCellId);
      if (nextCell) {
        self.setState({
          selectedCell : nextCell
        });
      }
    }

  },

  getNextRowId : function (currentRowId, getPrev) {
    var currentRow = this.props.table.rows.get(currentRowId);
    var indexCurrentRow = this.props.table.rows.indexOf(currentRow);
    var numberOfRows = this.props.table.rows.length;
    var nextIndex = getPrev ? indexCurrentRow - 1 : indexCurrentRow + 1;
    var nextRowIndex = Math.max(0, Math.min(nextIndex, numberOfRows - 1));
    var nextRowId = this.props.table.rows.at(nextRowIndex).getId();
    return nextRowId;
  },

  getPreviousRowId : function (currentRowId) {
    return this.getNextRowId(currentRowId, true);
  },

  getNextColumnId : function (currenColumnId, getPrev) {
    var currentColumn = this.props.table.columns.get(currenColumnId);
    var indexCurrentColumn = this.props.table.columns.indexOf(currentColumn);
    var numberOfColumns = this.props.table.columns.length;
    var nextIndex = getPrev ? indexCurrentColumn - 1 : indexCurrentColumn + 1;
    var nextColumnIndex = Math.max(0, Math.min(nextIndex, numberOfColumns - 1));
    var nextColumnId = this.props.table.columns.at(nextColumnIndex).getId();
    return nextColumnId;
  },

  getPreviousColumnId : function (currenColumnId) {
    return this.getNextColumnId(currenColumnId, true);
  },

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
                    selectedCellEditing={this.state.selectedCellEditing}/>
              <NewRow table={this.props.table} langtag={this.props.langtag}/>
            </div>
          </div>
        </section>
    );
  }
});

module.exports = Table;
