var React = require('react');
var Cell = require('./Cell.jsx');
var BackboneMixin = require('backbone-react-component');
var TableauxStore = require('../TableauxStore');

var Row = React.createClass({
  mixins : [BackboneMixin],

  render : function () {
    console.log('rendering Row', this.state.model);
    var self = this;
    var className = 'row row-' + this.state.model.id;
    return (
      <tr className={className}>
        {this.state.model.values.map(function (cell, index) {
          return (
            <Cell model={new TableauxStore.Cell({row: self.getModel(), value: cell, colIdx: index})}/>
          );
        })}
      </tr>
    );
  }
});

module.exports = Row;
