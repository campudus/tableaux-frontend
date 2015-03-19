var React = require('react');
var PureRenderMixin = require('react/addons').addons.PureRenderMixin;
var CellMixin = require('./CellMixin.js');

var Cell = React.createClass({
  propTypes : {
    cell : React.PropTypes.shape({
      kind : React.PropTypes.string.isRequired,
      content : React.PropTypes.any
    }).isRequired,
    row : React.PropTypes.number.isRequired,
    column : React.PropTypes.number.isRequired,
    save : React.PropTypes.func.isRequired
  },

  getInitialState : function () {
    return {editing : false, value : this.props.cell.content};
  },

  startEditMode : function () {
    console.log('start edit mode');
    this.setState({editing : true});
    this.render();
  },

  stopEditMode : function () {
    console.log('stop edit mode');
    var value = this.refs.input.getDOMNode().value;
    this.props.save(this.props.row, this.props.column, value);
    this.setState({value : value, editing : false});
    this.render();
  },

  render : function () {
    console.log('rendering cell');
    console.log(this.props.cell);
    if (this.state.editing) {
      return this.renderEditing();
    } else {
      return this.renderRegular();
    }
  },

  renderEditing : function () {
    var data = this.props.cell;

    return (
      <td>
        <input onChange={this.props.save(this.props.row, this.props.column)} onBlur={this.stopEditMode} type={data.kind} value={this.state.value} ref="input" />
      </td>
    );
  },

  renderRegular : function () {
    return (
      <td onClick={this.startEditMode}>{this.state.value}</td>
    );
  }
});

module.exports = Cell;
