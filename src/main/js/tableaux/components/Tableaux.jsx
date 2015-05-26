var React = require('react');
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
      console.log('got event', event, arguments);
      self.setState({currentTableIndex : event.index});
      self.forceUpdate();
    });
  },

  getInitialState : function () {
    return {currentTableIndex : 0};
  },

  render : function () {
    var tables = this.props.tables;
    var table = (tables.length > this.state.currentTableIndex) ?
      <Table key={this.state.currentTableIndex} table={tables.at(this.state.currentTableIndex)}/> : '';

    return (
      <div className="tableaux">
        <TableSwitcher currentIndex={this.state.currentTableIndex} tables={tables}/>
        {table}
      </div>
    );
  }
});

module.exports = Tableaux;