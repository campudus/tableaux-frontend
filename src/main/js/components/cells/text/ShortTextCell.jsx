var React = require('react');
var _ = require('lodash');

var Dispatcher = require('../../../dispatcher/Dispatcher');
var ShortTextEditCell = require('./ShortTextEditCell.jsx');

var ShortTextCell = React.createClass({

  displayName : 'ShortTextCell',

  propTypes : {
    langtag : React.PropTypes.string.isRequired,
    cell : React.PropTypes.object.isRequired,
    editing : React.PropTypes.bool.isRequired
  },

  getInitialState : function () {
    return null;
  },

  handleClick : function (event) {
    Dispatcher.trigger('toggleCellEditing', {
      cell : this.props.cell
    });
  },

  handleEditDone : function (newValue) {
    var cell = this.props.cell;

    if (cell.isMultiLanguage) {
      var value = _.clone(cell.value);
      value[this.props.langtag] = newValue;
      newValue = value;
    }

    console.log('triggering event ', cell.changeCellEvent, {newValue : newValue});
    Dispatcher.trigger(cell.changeCellEvent, {newValue : newValue});
    Dispatcher.trigger('toggleCellEditing', {
      cell : this.props.cell,
      editing : false
    });
  },

  getValue : function () {
    var cell = this.props.cell;

    var value;
    if (cell.isMultiLanguage) {
      value = cell.value[this.props.langtag];
    } else {
      value = cell.value;
    }

    return typeof value === "undefined" ? null : value;
  },

  renderTextCell : function (cell, value) {
    return (
      <div className='cell-content' onClick={this.handleClick}>
          {value === null ? "" : value}
        </div>
    );
  },

  render : function () {
    var cell = this.props.cell;

    if (!this.props.editing) {
      return this.renderTextCell(cell, this.getValue());
    } else {
      return <ShortTextEditCell cell={cell} langtag={this.props.langtag} onBlur={this.handleEditDone}/>;
    }
  }
});

module.exports = ShortTextCell;
