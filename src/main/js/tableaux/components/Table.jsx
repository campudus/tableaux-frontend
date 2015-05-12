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
    return (
      <table className="tableaux-table">
        <thead>
        <Columns collection={this.getModel().get('columns')}/>
        </thead>
        <Rows collection={this.getModel().get('rows')}/>
        <NewRow />
      </table>
    );
  }
});

module.exports = Table;