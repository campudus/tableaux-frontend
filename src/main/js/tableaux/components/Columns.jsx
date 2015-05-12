var React = require('react');
var BackboneMixin = require('backbone-react-component');
var TableauxStore = require('../TableauxStore');

var Columns = React.createClass({
  mixins : [BackboneMixin],

  componentDidMount : function () {
    this.getCollection().fetch();
  },

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
