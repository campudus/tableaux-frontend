var React = require('react');
var BackboneMixin = require('backbone-react-component');
var dispatcher = require('../TableauxDispatcher');
var TableauxConstants = require('../TableauxConstants');
var EditCell = require('./EditCell.jsx');
var LabelCell = require('./LabelCell.jsx');

var Cell = React.createClass({
  mixins : [BackboneMixin],

  handleLabelClick : function () {
    console.log('handling click on cell');
    var stuff = {colId : this.getModel().colId, rowId : this.getModel().rowId};
    console.log('this.getModel before setting', this.getModel().get('editing'));
    this.getModel().set('editing', true);
    console.log('this.getModel after setting', this.getModel().get('editing'));
    dispatcher.emit(TableauxConstants.START_EDIT_CELL, stuff);
    this.render();
  },

  handleEditDone : function () {
    console.log('editing of cell done');
    this.getModel().set('editing', false);
  },

  render : function () {
    console.log('rendering cell', this.getModel());
    var self = this;
    if (this.getModel().get('editing')) {
      console.log('returning an edit-cell!');
      return <EditCell model={self.getModel()} onBlur={self.handleEditDone}/>;
    } else {
      console.log('returning a label-cell!');
      return <LabelCell model={self.getModel()} onClick={self.handleLabelClick}/>;
    }
  }
});

module.exports = Cell;
