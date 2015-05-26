var React = require('react');
var AmpersandMixin = require('ampersand-react-mixin');
var Columns = require('./Columns.jsx');
var Rows = require('./Rows.jsx');
var NewRow = require('./NewRow.jsx');
var Dispatcher = require('../Dispatcher');

var Table = React.createClass({
  mixins : [AmpersandMixin],

  getInitialState : function () {
    return {isCreatingNewRow : false};
  },

  componentWillMount : function () {
    var self = this;
    var table = this.props.table;
    table.fetch({
      success : function () {
        table.columns.fetch({
          success : function () {
            table.rows.fetch();
          }
        });
      }
    });
    Dispatcher.on('add-row:' + table.id, function () {
      self.setState({isCreatingNewRow : true});
    });
  },

  render : function () {
    return (
      <table className="tableaux-table">
        <Columns columns={this.props.table.columns}/>
        <Rows rows={this.props.table.rows}/>
        <NewRow table={this.props.table} isLoading={(this.state.isCreatingNewRow)}/>
      </table>
    );
  }
});

module.exports = Table;
