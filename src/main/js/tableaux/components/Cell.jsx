var React = require('react');
var AmpersandMixin = require('ampersand-react-mixin');
var EditCell = require('./EditCell.jsx');
var LabelCell = require('./LabelCell.jsx');
var LinkCell = require('./LinkCell.jsx');
var Dispatcher = require('../Dispatcher');
var _ = require('lodash');

var Cell = React.createClass({
  mixins : [AmpersandMixin],

  propTypes : {
    cell : React.PropTypes.object.isRequired,
    language : React.PropTypes.string.isRequired
  },

  getInitialState : function () {
    return {isEditing : false};
  },

  handleLabelClick : function () {
    this.setState({isEditing : true});
  },

  handleEditDone : function (newValue) {
    var cell = this.props.cell;

    this.setState({isEditing : false});

    if (cell.isMultiLanguage) {
      var value = _.clone(cell.value);
      value[this.props.language] = newValue;
      newValue = value;
    }

    Dispatcher.trigger(cell.changeCellEvent, {newValue : newValue});
  },

  render : function () {
    var cell = this.props.cell;
    var language = this.props.language;

    if (cell.isLink) {
      return <LinkCell cell={cell} language={language}/>;
    } else {
      if (this.state.isEditing) {
        return <EditCell cell={cell} language={language} onBlur={this.handleEditDone}/>;
      } else {
        return <LabelCell cell={cell} language={language} onClick={this.handleLabelClick}/>;
      }
    }
  }
});

module.exports = Cell;
