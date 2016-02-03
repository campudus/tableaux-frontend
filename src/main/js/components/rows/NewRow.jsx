var React = require('react');
var AmpersandMixin = require('ampersand-react-mixin');
var Row = require('../../models/Row');
var ActionCreator = require('../../actions/ActionCreator');

var NewRow = React.createClass({
  mixins : [AmpersandMixin],

  propTypes : {
    table : React.PropTypes.object.isRequired
  },

  addRow : function () {
    var tableId = this.props.table.getId();
    ActionCreator.addRow(tableId);
  },

  render : function () {
    return (
      <div className="new-row">
        <div className="new-row-inner" onClick={this.addRow}>
            <i className="fa fa-plus-circle">
            </i>
            <span>Add new row</span>
          </div>
        </div>
    );
  }
});

module.exports = NewRow;
