var React = require('react');
var PureRenderMixin = require('react/addons').addons.PureRenderMixin;

var Row = require('./Row.jsx');
var TableSwitcher = require('./TableSwitcher.jsx');

var Tableaux = React.createClass({
  mixins : [PureRenderMixin],

  propTypes : {
    tableaux : React.PropTypes.shape({
      get : React.PropTypes.func.isRequired,
      put : React.PropTypes.func.isRequired,
      getColumns : React.PropTypes.func.isRequired
    }).isRequired
  },

  getInitialState : function () {
    return {loading : false};
  },

  save : function (rowId, columnId) {
    var tableaux = this.props.tableaux;
    return function (content) {
      tableaux.put(rowId, columnId, content);
    };
  },

  getValue : function (rowId, columnId) {
    return this.props.tableaux.get(rowId, columnId);
  },

  getColumns : function () {
    return this.props.tableaux.getColumns();
  },

  switchTable : function (id) {
    var that = this;
    this.props.tableaux.switchTable(id, function () {
      that.setState({loading : false});
    });
    this.setState({loading : true});
  },

  render : function () {
    console.log('rendering Tableaux');
    var tableaux = this.props.tableaux;
    var saveFn = this.save;
    var getColumnsFn = this.getColumns;
    var getValueFn = this.getValue;
    var switchFn = this.switchTable;
    console.log(tableaux);

    if (this.state.loading) {
      return (
        <div>
          <TableSwitcher tables={tableaux.getTables()} selected={tableaux.getCurrentTable()} switchFn={switchFn} />
          <div class="loader">Loading...</div>
        </div>
      );
    } else {
      return (
        <div>
          <TableSwitcher tables={tableaux.getTables()} selected={tableaux.getCurrentTable()} switchFn={switchFn} />
          <table className="tableaux">
            <thead>
              <tr>
        {tableaux.getCurrentTable().columns.map(function (column) {
          return (
            <th>{column.name}</th>
          );
        })}
              </tr>
            </thead>
            <tbody>
        {tableaux.getCurrentTable().rows.map(function (row) {
          console.log('rendering rows in table');
          console.log(row);
          return (
            <tr>
              <Row save={saveFn} getColumns={getColumnsFn} getValue={getValueFn} row={row.id} />
            </tr>
          );
        })}
            </tbody>
          </table>
        </div>
      );
    }
  }
});

module.exports = Tableaux;
