var React = require('react');
var AmpersandMixin = require('ampersand-react-mixin');
var Row = require('../models/Row');
var Dispatcher = require('../Dispatcher');

var NewRow = React.createClass({
  mixins : [AmpersandMixin],

  addRow : function () {
    Dispatcher.trigger('add-row:' + this.props.table.getId());
  },

  render : function () {
    var classes = 'new-row';
    if (this.props.isLoading) {
      classes = classes + ' loading';
    }

    return (
      <div className={classes}>
        {this.props.isLoading ?
          <div colSpan={this.props.table.columns.length}>[loading]</div> :
          <div colSpan={this.props.table.columns.length} onClick={this.addRow}>[add]</div>}
      </div>
    );
  }
});

module.exports = NewRow;
