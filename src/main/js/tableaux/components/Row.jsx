var React = require('react');
var Cell = require('./Cell.jsx');
var BackboneMixin = require('backbone-react-component');
var TableauxStore = require('../TableauxStore');

var Row = React.createClass({
  mixins : [BackboneMixin],

  render : function () {
    var className = 'row row-' + this.getModel().get('id');
    return (
      <tr className={className}>
        {this.getModel().get('values').map(function (cell) {
          return <Cell model={cell}/>
        })}
      </tr>
    );
  }
});

module.exports = Row;
