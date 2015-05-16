var React = require('react');
var BackboneMixin = require('backbone-react-component');
var TableauxStore = require('../TableauxStore');

var Columns = React.createClass({
  mixins : [BackboneMixin],

  render : function () {
    return (
      <tr className="heading">
        {this.getCollection().map(function (column) {
          return <th>{column.get('name')}</th>;
        })}
      </tr>
    );
  }
});

module.exports = Columns;
