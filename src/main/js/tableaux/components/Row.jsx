var React = require('react');
var Cell = require('./Cell.jsx');
var BackboneMixin = require('backbone-react-component');
var TableauxStore = require('../TableauxStore');

var Row = React.createClass({
  mixins : [BackboneMixin],

  render : function () {
    console.log('rendering row');
    var className = 'row row-' + this.getModel().id;
    var self = this;
    return (
      <tr className={className}>
        {this.getModel().cells.map(function (cell) {
          console.log('render cell from row', cell);
          console.log('cell=', cell);
          var key = self.getModel().table.id + '-' + cell.colId + '-' + cell.rowId;
          return <Cell key={key} model={cell}/>
        })}
      </tr>
    );
  }
});

module.exports = Row;
