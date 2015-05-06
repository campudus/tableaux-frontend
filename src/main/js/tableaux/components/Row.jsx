var React = require('react');
var Cell = require('./Cell.jsx');

var Row = React.createClass({
  render : function () {
    var className = 'row row-' + this.props.rowId;
    return (
      <tr className={className}>
        {this.props.collection.map(function(cell) {
          return (
            <Cell colId={cell.colId} rowId={cell.rowId} value={cell.value} />
          );
        })}
      </tr>
    );
  }
});

module.exports = Row;
