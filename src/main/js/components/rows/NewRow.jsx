var React = require('react');
var AmpersandMixin = require('ampersand-react-mixin');

var Dispatcher = require('../../dispatcher/Dispatcher');

var Row = require('../../models/Row');

var NewRow = React.createClass({
  mixins : [AmpersandMixin],

  getInitialState : function () {
    return {
      "loading" : false
    }
  },

  addRow : function () {
    var self = this;
    self.setState({loading : true});
    Dispatcher.trigger('add-row:' + this.props.table.getId(), function (error) {
      if (error) {
        console.error("callback from add-row with error", error);
      }
      self.setState({loading : false});
    });
  },

  render : function () {
    var classes = 'new-row';
    if (this.state.loading) {
      classes += ' loading';
    }
    return (
      <div className={classes} onClick={this.addRow}>
        <i className="fa fa-plus-circle">
        </i>
        <span>Add new row</span>

      </div>
    );
  }
});

module.exports = NewRow;
