var React = require('react');
var Rows = require('./Rows.jsx');
var Columns = require('./Columns.jsx');
var NewRow = require('./NewRow.jsx');
var Backbone = require('backbone');
var BackboneMixin = require('backbone-react-component');
var TableauxStore = require('../TableauxStore');

var Table = React.createClass({
  mixins : [BackboneMixin],

  componentDidMount : function () {
    this.getModel().fetch();
    this.getModel().get('columns').fetch();
    this.getModel().get('rows').fetch();
  },

  render : function () {
    var columns = this.getModel().get('columns');
    var rows = this.getModel().get('rows');
    return (
      <table className="tableaux-table">
        <thead>
        <Columns collection={columns}/>
        </thead>
        <Rows collection={rows}/>
        <NewRow />
      </table>
    );
  }
});

module.exports = Table;