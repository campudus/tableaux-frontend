var React = require('react');
var ReactDOM = require('react-dom');
var _ = require('lodash');
var AmpersandMixin = require('ampersand-react-mixin');
var Dispatcher = require('../dispatcher/Dispatcher');
var Columns = require('./columns/Columns.jsx');
var Rows = require('./rows/Rows.jsx');
var NewRow = require('./rows/NewRow.jsx');
var KeyboardShortcutsMixin = require('./mixins/KeyboardShortcutsMixin');

var Table = React.createClass({
  mixins : [AmpersandMixin, KeyboardShortcutsMixin],

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

    document.removeEventListener('keydown', this.onKeyboardShortcut);
  },

  componentDidMount : function () {
    this.setState({offsetTableData : ReactDOM.findDOMNode(this.refs.dataWrapper).getBoundingClientRect().top});
    //Don't change this to state, its more performant during scroll
    this.headerDOMElement = document.getElementById("tableHeader");
    window.addEventListener("resize", this.windowResize);
    document.addEventListener('keydown', this.onKeyboardShortcut);
    Dispatcher.on('toggleCellSelection', this.toggleCellSelection);
    Dispatcher.on('toggleCellEditing', this.toggleCellEditing);
  },

  componentWillUnmount : function () {
    window.removeEventListener("resize", this.windowResize);
    Dispatcher.off('toggleCellSelection', this.toggleCellSelection);
    Dispatcher.off('toggleCellEditing', this.toggleCellEditing);
  },

  toggleCellSelection : function (params) {
    console.log("toggleCellSelection: I want to select ", params.cell.column.getId(), " ", params.cell.rowId);
    this.setState({
      selectedCell : params.cell,
      selectedCellEditing : false
    });
  },

  toggleCellEditing : function (params) {
    console.log("toggleCellEditing");

    var editVal = params.editing;
    if (!this.state.selectedCell) {
      return;
    }

    if (params.cell.getId() === this.state.selectedCell.getId()) {
      console.log("setting CellEditing to", editVal);
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
    var rowId = self.getCurrentRowId();
    var columnId = self.getCurrentColumnId();

    switch (direction) {
      case "left":
        columnId = columnId - 1;
        break;

      case "right":
        columnId = columnId + 1;
        break;

      case "up":
        rowId = rowId - 1;
        break;

      case "down":
        rowId = rowId + 1;
        break;
    }

    //Todo: check the end of row and column also!
    if (rowId <= 0 || columnId <= 0) {
      return;
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

      //TODO Enter and escape should be triggered by the edited cell
      //FIXME: Cancel this enter event listener when pressed in edited cell. Problem is the synthetic event and native js event. Stoppropagation wont work
      enter : function (event) {
        console.log("Enter Table cellEditing. ", self.state.selectedCellEditing);
        console.log("Enter Table cellEditing isPropagationStopped ", event);
        if (self.state.selectedCell && !self.state.selectedCellEditing) {
          self.toggleCellEditing({cell : self.state.selectedCell});
        }
      },

      escape : function (event) {
        console.log("escape pressed");
        if (self.state.selectedCell && self.state.selectedCellEditing) {
          self.toggleCellEditing({cell : self.state.selectedCell, editing : false});
        }
      }

    };
  },

  getCurrentRowId : function () {
    return this.state.selectedCell ? this.state.selectedCell.rowId : 0;
  },

  getCurrentColumnId : function () {
    return this.state.selectedCell ? this.state.selectedCell.column.getId() : 0;
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
        <section id="table-wrapper" ref="tableWrapper">
          <div className="tableaux-table" ref="tableInner">
            <Columns ref="columns" columns={this.props.table.columns}/>
            <div ref="dataWrapper" className="data-wrapper" style={ this.tableDataHeight() }
                 onScroll={this.handleScroll}>
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
