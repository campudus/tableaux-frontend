var React = require('react');
var Dispatcher = require('../../Dispatcher');
var _ = require('lodash');

var TextEditCell = require('./TextEditCell.jsx');

var TextCell = React.createClass({

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

  renderSingleLanguage : function () {
    var cell = this.props.cell;
    return (
      <div className={'cell cell-' + cell.column.getId() + '-' + cell.rowId} onClick={this.handleLabelClick}>
        <span className='cell-content'>
          {cell.value}
        </span>
      </div>
    );
  },

  renderMultiLanguage : function () {
    var cell = this.props.cell;
    var language = this.props.language;
    var value = cell.value[language];

    return (
      <div className={'cell cell-' + cell.column.getId() + '-' + cell.rowId} onClick={this.handleLabelClick}>
        <span className='cell-content'>
          {value}
        </span>
      </div>
    );
  },

  render : function () {
    var cell = this.props.cell;
    var language = this.props.language;

    if (!this.state.isEditing) {
      if (cell.isMultiLanguage) {
        return this.renderMultiLanguage();
      } else {
        return this.renderSingleLanguage();
      }
    } else {
      return <TextEditCell cell={cell} language={language} onBlur={this.handleEditDone}/>;
    }
  }
});

module.exports = TextCell;
