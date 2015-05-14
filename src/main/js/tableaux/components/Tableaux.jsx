var React = require('react');
var Row = require('./Row.jsx');
var TableauxStore = require('../TableauxStore');
var dispatcher = require('../TableauxDispatcher');
var TableauxConstants = require('../TableauxConstants');
var BackboneMixin = require('backbone-react-component');
var Table = require('./Table.jsx');
var TableSwitcher = require('./TableSwitcher.jsx');
var TableCreator = require('./TableCreator.jsx');

var Tableaux = React.createClass({
  mixins : [BackboneMixin],

  getInitialState : function () {
    return {currentTableIndex : 0};
  },

  onTableChanged : function (entry) {
    var self = this;
    this.state.currentTableIndex = entry.index;
    this.getCollection().at(entry.index).fetch({
      success : function () {
        console.log('successfully fetched ' + entry.index, self.state);
      }
    });
  },

  onTableCreate : function (data) {
    new TableauxStore.Table.create({
      name : data.tableName,
      success : function () {
        console.log('success in create table!');
      }, error : function () {
        console.log('error creating table ' + data.tableName);
      }
    });
  },

  componentDidMount : function () {
    this.getCollection().fetch();

    dispatcher.register(TableauxConstants.CHANGE_TABLE, this.onTableChanged.bind(this));
    dispatcher.register(TableauxConstants.CREATE_TABLE, this.onTableCreate.bind(this));
  },

  render : function () {
    var table = (this.getCollection().length > this.state.currentTableIndex) ?
      <Table key={this.state.currentTableIndex} model={this.getCollection().at(this.state.currentTableIndex)}/> : '';
    var entries = this.getCollection().map(function (entry, index) {
      return {name : entry.get('name'), index : index};
    });

    return (
      <div className="tableaux">
        <TableCreator />
        <TableSwitcher currentIndex={this.state.currentTableIndex} entries={entries}/>
        {table}
      </div>
    );
  }
});

module.exports = Tableaux;