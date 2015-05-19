var React = require('react');
var AmpersandMixin = require('ampersand-react-mixin');
var Columns = require('./Columns.jsx');
var Rows = require('./Rows.jsx');

var Table = React.createClass({
  mixins : [AmpersandMixin],

  componentDidMount : function () {
    // here we should fetch the table
    console.log('fetching table');
    this.props.table.fetch();
    console.log('fetching table.columns');
    this.props.table.columns.fetch();
    console.log('fetching table.rows');
    this.props.table.rows.fetch();
    console.log('should fetch it..');
  },

  render : function () {
    //console.log('rendering table', this.getModel());
    //var columns = this.getModel().get('columns');
    //var rows = this.getModel().get('rows');
    console.log('rendering table', this.props.table);

    return (
      <table className="tableaux-table">
        <Columns columns={this.props.table.columns}/>
        <Rows rows={this.props.table.rows}/>
      </table>
    );
  }
});

module.exports = Table;
