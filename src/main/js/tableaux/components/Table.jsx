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
  },

  render : function () {
    console.log('rendering table');
    return (
      <table className="tableaux-table">
        <thead>
        <Columns collection={this.getModel().columns}/>
        </thead>
        <Rows collection={this.getModel().rows}/>
        <NewRow />
      </table>
    );
  }
});

module.exports = Table;