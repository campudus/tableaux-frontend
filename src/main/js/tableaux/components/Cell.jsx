var React = require('react');
var AmpersandMixin = require('ampersand-react-mixin');
var EditCell = require('./EditCell.jsx');
var LabelCell = require('./LabelCell.jsx');

var Cell = React.createClass({
  mixins : [AmpersandMixin],

  handleLabelClick : function () {
    this.props.cell.isEditing = true;
  },

  handleEditDone : function (newValue) {
    this.props.cell.isEditing = false;
    if (this.props.cell.value !== newValue) {
      this.props.cell.value = newValue;
      this.props.cell.save(this.props.cell, {
        parse : false,
        success : function () {
          console.log('saved successfully');
        },
        error : function () {
          console.log('save unsuccessful!');
        }
      });
    }
  },

  render : function () {
    console.log('rendering cell', this.props.cell);
    if (this.props.cell.isEditing) {
      return <EditCell cell={this.props.cell} onBlur={this.handleEditDone}/>;
    } else {
      return <LabelCell cell={this.props.cell} onClick={this.handleLabelClick}/>;
    }
  }
});

module.exports = Cell;
