var React = require('react');
var PureRenderMixin = require('react/addons').addons.PureRenderMixin;
var CellMixin = require('./CellMixin.js');
var TableauxStateType = require('../tableaux.js').reactType;

var Cell = React.createClass({
  mixins : [PureRenderMixin, CellMixin],

  propTypes : {
    tableaux : TableauxStateType,
    row : React.PropTypes.number.isRequired,
    column : React.PropTypes.number.isRequired
  },

  renderEditing : function () {
    var data = this.props.tableaux[this.props.row][this.props.column];

    return (
      <td>
        <input onblur={this.stopEditMode} type={data.kind} value={data.content} />
      </td>
    );
  },

  renderRegular : function () {
    var data = this.props.tableaux[this.props.row][this.props.column];

    return (
      <td onclick={this.startEditMode}>{data.content}</td>
    );
  }
});

module.exports = Cell;
