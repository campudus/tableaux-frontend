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
      <tr className={classes}>
        {this.props.isLoading ?
          <td colSpan={this.props.table.columns.length}>[loading]</td> :
          <td colSpan={this.props.table.columns.length} onClick={this.addRow}>[add]</td>}
      </tr>
    );
  }
});

module.exports = NewRow;
