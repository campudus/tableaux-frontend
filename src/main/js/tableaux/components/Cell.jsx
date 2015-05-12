var React = require('react');
var BackboneMixin = require('backbone-react-component');
var dispatcher = require('../TableauxDispatcher');
var TableauxConstants = require('../TableauxConstants');
var EditCell = require('./EditCell.jsx');
var LabelCell = require('./LabelCell.jsx');

var Cell = React.createClass({
  mixins : [BackboneMixin],

  handleLabelClick : function () {
    var stuff = {colId : this.getModel().colId, rowId : this.getModel().rowId};
    this.getModel().set('editing', true);
    dispatcher.emit(TableauxConstants.START_EDIT_CELL, stuff);
  },

  handleEditDone : function (event) {
    this.getModel().set('editing', false);
    if (event.changed) {
      this.getModel().set('value', event.newData);
      this.getModel().save();
    }
    dispatcher.emit(TableauxConstants.CHANGE_CELL_EVENT, event);
  },

  render : function () {
    if (this.getModel().get('editing')) {
      return <EditCell model={this.getModel()} onBlur={this.handleEditDone}/>;
    } else {
      return <LabelCell model={this.getModel()} onClick={this.handleLabelClick}/>;
    }
  }
});

module.exports = Cell;
