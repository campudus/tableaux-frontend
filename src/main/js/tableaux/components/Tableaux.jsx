var app = require('ampersand-app');
var React = require('react');
var _ = require('lodash');
var AmpersandMixin = require('ampersand-react-mixin');
var Table = require('./Table.jsx');
var TableSwitcher = require('./TableSwitcher.jsx');
var Dispatcher = require('../Dispatcher');

var Tableaux = React.createClass({
  mixins : [AmpersandMixin],

  displayName : 'Tableaux',

  propTypes : {
    tables : React.PropTypes.object.isRequired
  },

  switchTable : function (event) {
    console.log('got switch-table event', event);
    self.setState({currentTableId : event.id});
  },

  componentWillMount : function () {
    var self = this;
    this.props.tables.fetch();

    Dispatcher.on('switch-table', this.switchTable);
  },

  componentWillUnmount : function () {
    Dispatcher.off('switch-table', this.switchTable);
  },

  getInitialState : function () {
    return {currentTableId : this.props.currentTableId};
  },

  render : function () {
    var self = this;
    var tables = this.props.tables;

    var table = '';
    if (typeof tables.get(this.state.currentTableId) !== 'undefined') {
      table = <Table key={this.state.currentTableId} table={tables.get(this.state.currentTableId)}/>
    } else {
      console.error("No table found with id " + this.state.currentTableId);
    }

    return (
      <div className="tableaux">
        <TableSwitcher currentId={self.state.currentTableId} tables={tables}/>
        {table}
      </div>
    );
  }
});

module.exports = Tableaux;