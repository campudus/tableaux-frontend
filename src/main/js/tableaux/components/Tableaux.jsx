var React = require('react');
var Row = require('./Row.jsx');
var TableauxStore = require('../TableauxStore');
var TableauxConstants = require('../TableauxConstants');

var Tableaux = React.createClass({
  cellChanged : function (payload) {
  },

  componentDidMount : function () {
    TableauxStore.addCellChangeListener(this.cellChanged);
    this.token = dispatcher.register(TableauxConstants.START_EDIT_CELL, function(payload) {

    });
  },

  componentWillUnmount : function () {
    TableauxStore.removeCellChangeListener(this.cellChanged);
  },

  render : function () {
    return (
      <div className="tableaux">
        <table>
          <Row value="hello"/>
          <Row value="and"/>
          <Row value="bye"/>
        </table>
      </div>
    );
  }
});

module.exports = Tableaux;