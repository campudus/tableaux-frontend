var React = require("react");
var _ = require("lodash");

var Dispatcher = require("../../../dispatcher/Dispatcher");
var NumericEditCell = require("./NumericEditCell.jsx");
var ActionCreator = require("../../../actions/ActionCreator");

var NumericCell = React.createClass({

  propTypes: {
    cell: React.PropTypes.object.isRequired,
    langtag: React.PropTypes.string.isRequired,
    editing: React.PropTypes.bool.isRequired,
    setCellKeyboardShortcuts: React.PropTypes.func
  },

  getInitialState: function () {
    return {};
  },

  handleLabelClick: function (event) {
    console.log("Numeric.handleLabelClick");
    event.preventDefault();
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

  renderSingleLanguage: function () {
    var cell = this.props.cell;
    return (
        <div className={"cell-content"} onClick={this.handleLabelClick}>
          {cell.value}
        </div>
    );
  },

  renderMultiLanguage: function () {
    var cell = this.props.cell;
    var langtag = this.props.langtag;
    var value = cell.value[langtag];

    return (
        <div className={"cell-content"} onClick={this.handleLabelClick}>
          {value}
        </div>
    );
  },

  render: function () {
    var cell = this.props.cell;
    var langtag = this.props.langtag;

    if (!this.props.editing) {
      if (cell.isMultiLanguage) {
        return this.renderMultiLanguage();
      } else {
        return this.renderSingleLanguage();
      }
    } else {
      return <NumericEditCell cell={cell} langtag={langtag} onSave={this.handleEditDone} setCellKeyboardShortcuts={this.props.setCellKeyboardShortcuts}/>;
    }
  }
});

module.exports = NumericCell;
