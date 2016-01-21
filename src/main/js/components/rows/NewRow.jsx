var React = require('react');
var AmpersandMixin = require('ampersand-react-mixin');

var Dispatcher = require('../../dispatcher/Dispatcher');

var Row = require('../../models/Row');

var NewRow = React.createClass({
  mixins : [AmpersandMixin],

  addRow : function () {
    Dispatcher.trigger('add-row:' + this.props.table.getId(), function (error) {
      if (error) {
        console.error("callback from add-row with error", error);
      }
    });
  },

  render : function () {
    return (
        <div className="new-row" onClick={this.addRow}>
          <div className="new-row-inner">
            <i className="fa fa-plus-circle">
            </i>
            <span>Add new row</span>
          </div>
        </div>
    );
  }
});

module.exports = NewRow;
