var React = require('react');
var PureRenderMixin = require('react/addons').addons.PureRenderMixin;

var Cell = React.createClass({
  propTypes : {
    kind : React.PropTypes.string.isRequired,
    row : React.PropTypes.number.isRequired,
    column : React.PropTypes.number.isRequired,
    save : React.PropTypes.func.isRequired,
    getValue : React.PropTypes.func.isRequired
  },

  getInitialState : function () {
    return {editing : false};
  },

  startEditMode : function (e) {
    console.log('start edit mode');
    this.setState({editing : true});
    console.log(e);
    this.render();
  },

  stopEditMode : function () {
    var value = this.refs.input.getDOMNode().value;
    this.props.save(this.props.row, this.props.column)(value);
    this.setState({editing : false});
  },

  render : function () {
    console.log('rendering cell[' + this.props.row + ',' + this.props.column + ']');
    if (this.state.editing) {
      return this.renderEditing();
    } else {
      return this.renderRegular();
    }
  },

  renderEditing : function () {
    return (
      <td className="cell editing">
        <input onBlur={this.stopEditMode} type={this.props.kind} defaultValue={this.props.getValue(this.props.row,
          this.props.column)} ref="input" />
      </td>
    );
  },

  renderRegular : function () {
    return (
      <td onClick={this.startEditMode} className="cell regular">{this.props.getValue(this.props.row, this.props.column)}</td>
    );
  }
});

module.exports = Cell;
