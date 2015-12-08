var React = require('react');
var AmpersandMixin = require('ampersand-react-mixin');

var Dispatcher = require('../dispatcher/Dispatcher');

var Row = require('../models/Row');

var NewRow = React.createClass({
  mixins : [AmpersandMixin],

  getInitialState : function () {
    return {
      "loading" : false
    }
  },

  addRow : function () {
    Dispatcher.trigger('add-row:' + this.props.table.getId());

    this.setState({loading : true});
  },

  addedRow : function () {
    this.setState({loading : false})
  },

  componentWillMount : function () {
    Dispatcher.on('added-row:' + this.props.table.getId(), this.addedRow);
  },

  componentWillUnmount : function () {
    Dispatcher.off('added-row:' + this.props.table.getId(), this.addedRow);
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
