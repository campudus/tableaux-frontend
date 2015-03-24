var React = require('react');
var PureRenderMixin = require('react/addons').addons.PureRenderMixin;

var Row = require('./Row.jsx');

var Tableaux = React.createClass({
  mixins : [PureRenderMixin],

  propTypes : {
    id : React.PropTypes.number.isRequired,
    tableaux : React.PropTypes.shape({
      get : React.PropTypes.func.isRequired,
      put : React.PropTypes.func.isRequired,
      getColumns : React.PropTypes.func.isRequired
    }).isRequired
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

  render : function () {
    console.log('rendering Tableaux');
    var tableaux = this.props.tableaux;
    var saveFn = this.save;
    var getColumnsFn = this.getColumns;
    var getValueFn = this.getValue;
    console.log(tableaux);

    return (
      <table>
        <tbody>
        {tableaux.getColumns().map(function (row) {
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
    );
  }
});

module.exports = Tableaux;
