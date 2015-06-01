var React = require('react');

var Cell = React.createClass({

  render : function () {
    var cell = this.props.cell;
    return (
      <td className={'cell cell-' + cell.column.getId() + '-' + cell.rowId} onClick={this.props.onClick}>
        {cell.value}
      </td>
    );
  }

});

module.exports = Cell;
