var React = require('react');
var BackboneMixin = require('backbone-react-component');
var dispatcher = require('../TableauxDispatcher');
var TableauxConstants = require('../TableauxConstants');

var Cell = React.createClass({
  mixins : [BackboneMixin],

  emitChangeIfEdited : function () {
    var value = this.refs.input.getDOMNode().value;
    var event = {
      tableId : this.getModel().tableId,
      colId : this.props.colId,
      rowId : this.props.rowId,
      oldData : this.props.value,
      newData : value,
      changed : value !== this.props.value
    };
    if (this.props.onBlur) {
      this.props.onBlur(event);
    }
  },

  componentDidMount : function () {
    var node = this.refs.input.getDOMNode();
    node.focus();
    // Sets cursor to end of input field
    node.value = node.value;
  },

  componentWillMount : function () {
    this.inputName = 'cell-' + this.getModel().tableId + '-' + this.props.colId + '-' + this.props.rowId;
  },

  render : function () {
    var inputType = 'text';
    var value = this.getModel().get('value') || null;
    return (
      <td className="cell editing">
        <input type={inputType}
               name={this.inputName}
               defaultValue={value}
               onBlur={this.emitChangeIfEdited}
               ref="input"/>
      </td>
    );
  }
});

module.exports = Cell;
