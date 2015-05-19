var React = require('react');
var AmpersandMixin = require('ampersand-react-mixin');
var Table = require('./Table.jsx');
var TableSwitcher = require('./TableSwitcher.jsx');

var Tableaux = React.createClass({
  mixins : [AmpersandMixin],

  displayName : 'Tableaux',

  propTypes : {
    tables : React.PropTypes.object.isRequired
  },

  componentWillMount : function () {
    this.props.tables.fetch();
  },

  getInitialState : function () {
    return {currentTableIndex : 0};
  },

  render : function () {
    var tables = this.props.tables;
    var table = (tables.length > this.state.currentTableIndex) ?
      <Table key={this.state.currentTableIndex} table={tables.at(this.state.currentTableIndex)}/> : '';
    var entries = tables.map(function (entry, index) {
      return {name : entry.get('name'), index : index};
    });

    return (
      <div className="tableaux">
        <TableSwitcher currentIndex={this.state.currentTableIndex} entries={entries}/>
        {table}
      </div>
    );
  }
});

module.exports = Tableaux;