var React = require('react');
var dispatcher = require('../TableauxDispatcher');
var BackboneMixin = require('backbone-react-component');
var TableauxConstants = require('../TableauxConstants');

var Cell = React.createClass({
  mixins : [BackboneMixin],

  handleClick : function () {
    var stuff = {colId : this.state.model.colIdx, rowId : this.state.model.row.id};
    console.log('handling click', stuff);
    dispatcher.emit(TableauxConstants.START_EDIT_CELL, stuff);
  },

  render : function () {
    return (
      <td className="cell" onClick={this.handleClick}>
        {this.state.model.value}
      </td>
    );
  }
});

module.exports = Cell;
