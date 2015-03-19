var React = require('react');

var CellMixin = {
  propTypes : {
    edit : React.PropTypes.bool,
    row : React.PropTypes.number.isRequired,
    column : React.PropTypes.number.isRequired
  },

  startEditMode : function() {
    this.props.edit = true;
    console.log('clicked, edit=' + this.props.edit);
  },

  stopEditMode : function() {
    this.props.edit = false;
    console.log('blurred, edit=' + this.props.edit);
  },

  render : function () {
    if (this.props.edit) {
      return this.renderEditing();
    } else {
      return this.renderRegular();
    }
  }
};

module.exports = CellMixin;
