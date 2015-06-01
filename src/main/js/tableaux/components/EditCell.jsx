var React = require('react');

var Cell = React.createClass({

  componentDidMount : function () {
    var node = this.refs.input.getDOMNode();
    node.focus();
    // Sets cursor to end of input field
    node.value = node.value;
  },

  doneEditing : function() {
    this.props.onBlur(this.refs.input.getDOMNode().value);
  },

  componentWillMount : function () {
    this.inputName = 'cell-' + this.props.cell.tableId + '-' + this.props.cell.column.getId() + '-' + this.props.cell.rowId;
  },

  render : function () {
    var inputType = 'text';
    var cell = this.props.cell;
    var value = cell.value || null;
    return (
      <td className={'cell editing cell-' + cell.column.getId() + '-' + cell.rowId}>
        <input type={inputType}
               name={this.inputName}
               defaultValue={value}
               onBlur={this.doneEditing}
               ref="input"/>
      </td>
    );
  }
});

module.exports = Cell;
