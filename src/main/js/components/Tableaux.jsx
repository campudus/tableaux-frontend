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

  save : function(rowId, columnId) {
    return function(content) {
      console.log('saving cell:');
      console.log(rowId);
      console.log(columnId);
      console.log(content);
      tableaux[rowId][columnId].content = content;
    };
  },

  render : function () {
    console.log('rendering Tableaux');
    console.log(tableaux);
    var saveFn = this.save;
    console.log(saveFn);

    return (
      <table>
        <tbody>
        {tableaux.map(function (row, rowId) {
          console.log('rendering rows in table');
          console.log(row);
          return (
            <tr>
              <Row save={saveFn} cells={row} row={rowId} />
            </tr>
          );
        })}
        </tbody>
      </table>
    );
  }
});

React.render(<Tableaux />, document.getElementById('tableaux'));
