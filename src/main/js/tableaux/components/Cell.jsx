var React = require('react');
var AmpersandMixin = require('ampersand-react-mixin');
var EditCell = require('./EditCell.jsx');
var LabelCell = require('./LabelCell.jsx');
var LinkCell = require('./LinkCell.jsx');
var Dispatcher = require('../Dispatcher');

var Cell = React.createClass({
  mixins : [AmpersandMixin],

  getInitialState : function () {
    return {isEditing : false};
  },

  handleLabelClick : function () {
    this.setState({isEditing : true});
  },

  handleEditDone : function (newValue) {
    var cell = this.props.cell;
    this.setState({isEditing : false});
    Dispatcher.trigger('change-cell:' + cell.tableId + ':' + cell.column.getId() + ':' + cell.rowId,
      {newValue : newValue});
  },

  render : function () {
    if (this.props.cell.isLink) {
      return <LinkCell cell={this.props.cell}/>;
    } else {
      if (this.state.isEditing) {
        return <EditCell cell={this.props.cell} onBlur={this.handleEditDone}/>;
      } else {
        return <LabelCell cell={this.props.cell} onClick={this.handleLabelClick}/>;
      }
    }
  }
});

module.exports = Cell;
