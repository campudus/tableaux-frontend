var React = require('react');

var LabelCell = React.createClass({

  render : function () {
    var cell = this.props.cell;
    return (
      <td className={'cell cell-' + cell.column.getId() + '-' + cell.rowId} onClick={this.props.onClick}>
        {cell.value}
      </td>
    );
  }

});

module.exports = LabelCell;
