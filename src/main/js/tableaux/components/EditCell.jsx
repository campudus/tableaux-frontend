var React = require('react');
var TableauxDispatcher = require('../TableauxDispatcher');
var TableauxConstants = require('../TableauxConstants');

var Cell = React.createClass({

  emitChangeIfEdited : function () {
    TableauxDispatcher.dispatch(TableauxConstants.CHANGE_CELL_EVENT, {
      actionType : 'cell-edited',
      colId : this.props.colId,
      rowId : this.props.rowId,
      oldData : this.props.value,
      newData : value,
      changed : value !== this.props.value
    });
  },

  render : function () {
    var inputType = 'text';
    var value = this.props.value || null;
    return (
      <td className="cell editing">
        <input type={inputType} name={this.props.colId} defaultValue={value} onBlur={this.emitChangeIfEdited}
               ref="input"/>
      </td>
    );
  }
});

module.exports = Cell;
