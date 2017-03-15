var React = require("react");
var _ = require("lodash");

var Dispatcher = require("../../../dispatcher/Dispatcher");
var ShortTextEditCell = require("./ShortTextEditCell.jsx");
var ActionCreator = require("../../../actions/ActionCreator");

var ShortTextCell = React.createClass({

  displayName: "ShortTextCell",

  propTypes: {
    langtag: React.PropTypes.string.isRequired,
    cell: React.PropTypes.object.isRequired,
    editing: React.PropTypes.bool.isRequired,
    setCellKeyboardShortcuts: React.PropTypes.func
  },

  getInitialState: function () {
    return null;
  },

  handleClick: function (event) {
    ActionCreator.toggleCellEditing();
  },

  handleEditDone: function (newValue) {
    var cell = this.props.cell;
    var valueToSave;

    if (cell.isMultiLanguage) {
      valueToSave = {};
      valueToSave[this.props.langtag] = newValue;
    } else {
      valueToSave = newValue;
    }

    ActionCreator.changeCell(cell, valueToSave);
    ActionCreator.toggleCellEditing(false);
  },

  getValue: function () {
    var cell = this.props.cell;

    var value;
    if (cell.isMultiLanguage) {
      value = cell.value[this.props.langtag];
    } else {
      value = cell.value;
    }

    return typeof value === "undefined" ? null : value;
  },

  renderTextCell: function (cell, value) {
    return (
      <div className='cell-content' onClick={this.handleClick}>
        {value === null ? "" : value}
      </div>
    );
  },

  render: function () {
    var cell = this.props.cell;

    if (!this.props.editing) {
      return this.renderTextCell(cell, this.getValue());
    } else {
      return <ShortTextEditCell cell={cell} langtag={this.props.langtag} onBlur={this.handleEditDone}
                                setCellKeyboardShortcuts={this.props.setCellKeyboardShortcuts}/>;
    }
  }
});

module.exports = ShortTextCell;
