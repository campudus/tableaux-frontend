var React = require('react');
var dispatcher = require('../TableauxDispatcher');
var TableauxConstants = require('../TableauxConstants');

var Cell = React.createClass({

  getInitialState : function () {
    return {
      colId : this.props.colId,
      rowId : this.props.rowId,
      value : this.props.value
    };
  },

  handleClick : function () {
    dispatcher.emit(TableauxConstants.START_EDIT_CELL, {colId : this.props.colId, rowId : this.props.rowId});
  },

  render : function () {
    return (
      <td className="cell" onClick={this.handleClick}>
        {this.props.value}
      </td>
    );
  }
});

module.exports = Cell;
