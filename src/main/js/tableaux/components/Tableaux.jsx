var React = require('react');
var Row = require('./Row.jsx');
var TableauxStore = require('../TableauxStore');
var TableauxConstants = require('../TableauxConstants');
var BackboneMixin = require('backbone-react-component');
var Table = require('./Table.jsx');

var Tableaux = React.createClass({
  mixins : [BackboneMixin],

  getInitialState : function () {
    return {currentTableIndex : 0};
  },

  componentDidMount : function () {
    this.getCollection().fetch();
  },

  render : function () {
    var self = this;
    console.log('state.collection', this.state.collection);
    var tables = this.state.collection.map(function(table) {
      return new TableauxStore.Table(table);
    });
    var table = (this.state.collection.length > 0) ? <Table model={tables[this.state.currentTableIndex]}/> : '';
    return (
      <div className="tableaux">
        <ul>
          {this.state.collection.map(function (entry, index) {
            return (
              <li className={index === self.state.currentTableIndex ? 'active' : 'inactive'}>{entry.name}</li>
            );
          })}
        </ul>
        {table}
      </div>
    );
  }
});

module.exports = Tableaux;