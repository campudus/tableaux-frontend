var React = require('react');
var AmpersandMixin = require('ampersand-react-mixin');
var Columns = require('./Columns.jsx');
var Rows = require('./Rows.jsx');
var NewRow = require('./NewRow.jsx');
var Dispatcher = require('../Dispatcher');

var Table = React.createClass({
  mixins : [AmpersandMixin],

  componentWillMount : function () {
    var table = this.props.table;

    table.columns.fetch({
      success : function () {
        table.rows.fetch();
      }
    });
  },

  componentWillUnmount : function () {
    console.log('Table.componentWillUnmount', this.props.table.getId());
  },

  render : function () {
    return (
      <section id="table-wrapper" ref="tableWrapper">
        <div className="tableaux-table" ref="tableInner">
          <Columns columns={this.props.table.columns}/>
          <Rows rows={this.props.table.rows}/>

          <NewRow table={this.props.table}/>
        </div>
      </section>
    );
  }
});

module.exports = Table;
