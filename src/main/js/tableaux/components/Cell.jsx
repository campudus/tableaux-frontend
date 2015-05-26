var React = require('react');
var AmpersandMixin = require('ampersand-react-mixin');
var EditCell = require('./EditCell.jsx');
var LabelCell = require('./LabelCell.jsx');
var Dispatcher = require('../Dispatcher');

var Cell = React.createClass({
  mixins : [AmpersandMixin],

  handleLabelClick : function () {
    this.props.cell.isEditing = true;
  },

  handleEditDone : function (newValue) {
    var cell = this.props.cell;
    cell.isEditing = false;
    Dispatcher.trigger('change-cell:' + cell.tableId + ':' + cell.colId + ':' + cell.rowId, {newValue : newValue});
  },

  render : function () {
    console.log('rendering cell', this.props.cell);
    if (this.props.cell.isEditing) {
      return <EditCell cell={this.props.cell} onBlur={this.handleEditDone}/>;
    } else {
      return <LabelCell cell={this.props.cell} onClick={this.handleLabelClick}/>;
    }
  }
});

module.exports = Cell;
