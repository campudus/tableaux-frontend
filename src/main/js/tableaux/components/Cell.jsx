var React = require('react');
var dispatcher = require('../TableauxDispatcher');
var BackboneMixin = require('backbone-react-component');
var TableauxConstants = require('../TableauxConstants');

var Cell = React.createClass({
  mixins : [BackboneMixin],

  handleClick : function () {
    var stuff = {colId : this.getModel().colId, rowId : this.getModel().rowId};
    console.log('handling click', stuff);
    dispatcher.emit(TableauxConstants.START_EDIT_CELL, stuff);
  },

  render : function () {
    return (
      <td className="cell" onClick={this.handleClick}>
        {this.getModel().value}
      </td>
    );
  }
});

module.exports = Cell;
