var React = require('react');
var BackboneMixin = require('backbone-react-component');
var dispatcher = require('../TableauxDispatcher');
var TableauxConstants = require('../TableauxConstants');

var Cell = React.createClass({
  mixins : [BackboneMixin],

  emitChangeIfEdited : function () {
    var value = this.refs.input.value;
    var event = {
      tableId : this.getModel().tableId,
      colId : this.props.colId,
      rowId : this.props.rowId,
      oldData : this.props.value,
      newData : value,
      changed : value !== this.props.value
    };
    console.log('changed edit cell=', event);
    dispatcher.emit(TableauxConstants.CHANGE_CELL_EVENT, event);
  },

  componentWillMount : function() {
    console.log('will mount edit cell');
  },

  render : function () {
    console.log('render edit cell!');
    var inputType = 'text';
    var value = this.props.value || null;
    return (
      <td className="cell editing">
        <input type={inputType}
               name={'new-cell-in-col-' + this.props.colId}
               defaultValue={value}
               onBlur={this.emitChangeIfEdited}
               ref="input"/>
      </td>
    );
  }
});

module.exports = Cell;
