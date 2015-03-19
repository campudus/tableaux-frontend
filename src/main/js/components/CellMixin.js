var React = require('react');
var tableaux = require('../tableaux.js');

var CellMixin = {
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
  }
};

module.exports = CellMixin;
