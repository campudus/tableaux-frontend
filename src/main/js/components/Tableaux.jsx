var React = require('react');
var PureRenderMixin = require('react/addons').addons.PureRenderMixin;

var tableaux = require('../tableaux.js');
var Row = require('./Row.jsx');

var Tableaux = React.createClass({
  mixins : [PureRenderMixin],

  propTypes : {
    tableaux : React.PropTypes.arrayOf(React.PropTypes.arrayOf(React.PropTypes.shape({
      kind : React.PropTypes.string.isRequired,
      content : React.PropTypes.any,
      editing : React.PropTypes.bool
    }))).isRequired
  },

  save : function (rowId, columnId) {
    return function (content) {
      console.log('saving cell:');
      console.log(tableaux[rowId][columnId].content);
      console.log('to');
      console.log(content);
      tableaux[rowId][columnId].content = content;
    };
  },

  getValue : function (rowId, columnId) {
    return tableaux[rowId][columnId].content;
  },

  getRow : function (rowId) {
    return function () {
      return tableaux[rowId];
    };
  },

  render : function () {
    console.log('rendering Tableaux');
    console.log(tableaux);
    var saveFn = this.save;
    var getRowFn = this.getRow;
    var getValueFn = this.getValue;

    return (
      <table>
        <tbody>
        {tableaux.map(function (row, rowId) {
          console.log('rendering rows in table');
          console.log(row);
          return (
            <tr>
              <Row save={saveFn} getRow={getRowFn} getValue={getValueFn} cells={row} row={rowId} />
            </tr>
          );
        })}
        </tbody>
      </table>
    );
  }
});

module.exports = Tableaux;