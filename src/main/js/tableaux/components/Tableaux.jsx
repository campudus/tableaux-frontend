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

  componentWillMount : function () {
    var self = this;
    this.props.tables.fetch();

    Dispatcher.on('switch-table', function (event) {
      console.log('got switch-table event', event);
      self.setState({currentTableId : event.id});
    });
  },

  getInitialState : function () {
    var id = isNaN(this.props.currentTableId) ? null : this.props.currentTableId;

    return {currentTableId : id};
  },

  render : function () {
    var self = this;
    var tables = this.props.tables;

    var index = _.findIndex(tables.models, function (table, idx) {
      return table.id === self.state.currentTableId;
    });

    var table = '';
    if (index > -1) {
      table = <Table key={this.state.currentTableId} table={tables.get(this.state.currentTableId)}/>
    } else if (typeof tables.at(0) !== 'undefined') {
      // TODO we shouldn't change the state here, but what else should be do?
      this.state.currentTableId = tables.at(0).getId();
      app.router.history.navigate('table/' + tables.at(0).getId(), {trigger : false});
      table = <Table key={tables.at(0).getId()} table={tables.at(0)}/>
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