var React = require('react');
var Row = require('./Row.jsx');
var BackboneMixin = require('backbone-react-component');
var TableauxStore = require('../TableauxStore');

var Rows = React.createClass({
  mixins : [BackboneMixin],

  render : function () {
    return (
      <tbody className="data">
      {this.getCollection().map(function (row, index) {
        return <Row model={row} index={index}/>;
      })}
      </tbody>
    );
  }
});

module.exports = Rows;
