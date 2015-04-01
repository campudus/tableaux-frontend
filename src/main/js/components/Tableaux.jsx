var React = require('react');
var PureRenderMixin = require('react/addons').addons.PureRenderMixin;

var Row = require('./Row.jsx');
var TableSwitcher = require('./TableSwitcher.jsx');
var Status = require('./Status.jsx');

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
    return {loading : false, status : {kind : 'empty', text : ''}};
  },

  save : function (rowId, columnId) {
    var tableaux = this.props.tableaux;
    var that = this;
    return function (content) {
      that.setState({status: {kind: 'saving', text:'Saving...'}});
      tableaux.put(rowId, columnId, content, function(status) {
        console.log('put done: ', status);
        if (status.error) {
          that.setState({status : {kind : 'error', text : 'Problems while saving!'}});
        } else {
          that.setState({status : {kind : 'saved', text : 'Everything saved!'}});
        }
      });
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
      that.setState({status : {kind : 'empty', text : ''}});
      that.setState({loading : false});
    });
    this.setState({status : {kind : 'loading', text : 'loading'}});
    this.setState({loading : true});
  },

  changeStatus : function (text, kind) {
    this.setState({status : {kind : kind, text : text}});
  },

  render : function () {
    console.log('rendering Tableaux');
    var tableaux = this.props.tableaux;
    var saveFn = this.save;
    var getColumnsFn = this.getColumns;
    var getValueFn = this.getValue;
    var switchFn = this.switchTable;
    var changeStatusFn = this.changeStatus;
    console.log(tableaux);

    if (this.state.loading) {
      return (
        <div>
          <TableSwitcher tables={tableaux.getTables()} selected={tableaux.getCurrentTable()} switchFn={switchFn} changeStatus={changeStatusFn} />
          <Status status={this.state.status} />
          <div class="loader">Loading...</div>
        </div>
      );
    } else {
      return (
        <div>
          <TableSwitcher tables={tableaux.getTables()} selected={tableaux.getCurrentTable()} switchFn={switchFn} />
          <Status status={this.state.status} />
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
