var React = require('react');
var AmpersandMixin = require('ampersand-react-mixin');

var TextCell = require('./text/TextCell.jsx');
var NumericCell = require('./numeric/NumericCell.jsx');
var LinkCell = require('./link/LinkCell.jsx');
var AttachmentCell = require('./attachment/AttachmentCell.jsx');
var BooleanCell = require('./boolean/BooleanCell.jsx');
var DateTimeCell = require('./datetime/DateTimeCell.jsx');
var Dispatcher = require('../../dispatcher/Dispatcher');
var KeyboardShortcutsMixin = require('../mixins/KeyboardShortcutsMixin');

var Cell = React.createClass({
  mixins : [AmpersandMixin, KeyboardShortcutsMixin],

  displayName : "Cell",

  propTypes : {
    cell : React.PropTypes.object.isRequired,
    langtag : React.PropTypes.string.isRequired,
    selected : React.PropTypes.bool,
    editing : React.PropTypes.bool
  },

  cellClicked : function () {
    /**
     * Fire event which cell wants to toggle selected state.
     * Keep in mind: Child elements needs to allow propagation
     */
    console.log("cell clicked");

    if (this.props.selected === true) {
      console.log("is selected, edit it");

      Dispatcher.trigger('toggleCellEditing', {
        cell : this.props.cell
      });

    } else {

      Dispatcher.trigger('toggleCellSelection', {
        cell : this.props.cell,
        selected : this.props.selected
      });
    }

  },

  // Todo: can be deleted
  getKeyboardShortcuts : function () {
    var self = this;
    return {
      enter : function () {
        console.log("CELL ENTER");

      }
    };
  },

  render : function () {
    var cellKind = null;
    var cell = this.props.cell;

    switch (this.props.cell.kind) {

      //todo: switch language to langtag!!! Important LANGTAG
      case "link":
        cellKind = <LinkCell cell={this.props.cell} language={this.props.langtag}/>;

      case "attachment":
        cellKind = <AttachmentCell cell={this.props.cell} language={this.props.langtag}/>;
        break;

      case "numeric":
        cellKind = <NumericCell cell={this.props.cell} language={this.props.langtag}/>;
        break;

      case "boolean":
        cellKind = <BooleanCell cell={this.props.cell} language={this.props.langtag}/>;
        break;

      case "datetime":
        cellKind = <DateTimeCell cell={this.props.cell} language={this.props.langtag}/>;
        break;

      default:
        cellKind = <TextCell cell={this.props.cell} langtag={this.props.langtag} editing={this.props.editing}/>;
        break;
    }

    var cellClass = "cell" + " cell-" + cell.column.getId() + "-" + cell.rowId + (this.props.selected ? " selected" : "");

    return (
        <div className={cellClass} onClick={this.cellClicked}>
          {cellKind}
        </div>
    )
  }
});

module.exports = Cell;
