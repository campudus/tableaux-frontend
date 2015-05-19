var React = require('react');
var AmpersandMixin = require('ampersand-react-mixin');

var Row = React.createClass({
  mixins : [AmpersandMixin],

  render : function () {
    var className = 'row row-' + this.props.row.getId();
    return (
      <tr className={className}>
        {this.props.row.cells.map(function (cell, idx) {
          console.log('in cell?', cell);
          return <td key={idx}>hello cell {cell.value}</td>;
        })}
      </tr>
    );
  }
});

module.exports = Row;
