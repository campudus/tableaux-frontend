var React = require('react');
var Row = require('./Row.jsx');
var TableauxStore = require('../TableauxStore');
var dispatcher = require('../TableauxDispatcher');
var TableauxConstants = require('../TableauxConstants');
var BackboneMixin = require('backbone-react-component');
var Table = require('./Table.jsx');
var TableSwitcher = require('./TableSwitcher.jsx');

var Tableaux = React.createClass({
  mixins : [BackboneMixin],

  getInitialState : function () {
    return {currentTableIndex : 0};
  },

  onTableChanged : function (entry) {
    this.state.currentTableIndex = entry.index;
    this.getCollection().at(entry.index).fetch();
  },

  componentDidMount : function () {
    this.getCollection().fetch();

    dispatcher.register(TableauxConstants.CHANGE_TABLE, this.onTableChanged.bind(this));
  },

  render : function () {
    console.log('(re?)-rendering Tableaux', this.getCollection(), this.state.currentTableIndex);
    var self = this;
    var table = (this.getCollection().length > 0) ?
      <Table model={this.getCollection().at(this.state.currentTableIndex)}/> : '';
    var entries = self.getCollection().map(function (entry, index) {
      return {name : entry.name, index : index};
    });

    return (
      <div className="tableaux">
        <TableSwitcher currentIndex={self.state.currentTableIndex} entries={entries}/>
        {table}
      </div>
    );
  }
});

module.exports = Tableaux;