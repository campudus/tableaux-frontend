var React = require('react');
var EditCell = require('./EditCell.jsx');
var BackboneMixin = require('backbone-react-component');
var TableauxStore = require('../TableauxStore');

var NewRow = React.createClass({
  mixins : [BackboneMixin],

  render : function () {
    return (
      <tr className="new-row">
        {this.getModel().columns.map(function (col) {
          return <EditCell colId={col.id}/>;
        })}
      </tr>
    );
  }
});

module.exports = NewRow;
