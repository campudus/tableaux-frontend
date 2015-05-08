var React = require('react');
var Row = require('./Row.jsx');
var Backbone = require('backbone');
var BackboneMixin = require('backbone-react-component');
var TableauxStore = require('../TableauxStore');

var old = Backbone.sync;
Backbone.sync = function (a, b, c) {
  console.log('sync!', arguments);
  old(a, b, c);
};

var Table = React.createClass({
  mixins : [BackboneMixin],

  componentDidMount : function () {
    this.getModel().fetch();
  },

  render : function () {
    var self = this;
    console.log('Table.model=', this.state.model);
    return (
      <table className="tableaux-table">
        <thead>
        <tr className="heading">
          {this.state.model.columns.map(function (column) {
            return <th>{column.name}</th>
          })}
        </tr>
        </thead>
        <tbody>
        {this.state.model.rows.map(function (row) {
          return <Row model={new TableauxStore.Row(row, {table : self.getModel()})}/>;
        })}
        <tr className="create">
          <td>
            new row...
          </td>
        </tr>
        </tbody>
      </table>
    );
  }
});

module.exports = Table;