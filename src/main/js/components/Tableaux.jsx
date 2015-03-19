var React = require('react');
var PureRenderMixin = require('react/addons').addons.PureRenderMixin;

var store = require('../tableaux.js');
var TableauxStateType = store.reactType;
var Row = require('./Row.jsx');

var Tableaux = React.createClass({
  mixins : [PureRenderMixin],

  propTypes : {
    tableaux : TableauxStateType
  },

  handleClick : function () {
    console.log('clicked on tableaux.');
  },

  render : function () {
    var tableaux = this.props.tableaux;
    console.log('rendering Tableaux');
    console.log(tableaux);

    return (
      <table onclick={this.handleClick}>
        <tbody>
        {tableaux.map(function (rows, rowId) {
          return (
            <tr>
              <Row tableaux={tableaux} row={rowId} />
            </tr>
          );
        })}
        </tbody>
      </table>
    );
  }
});

React.render(<Tableaux tableaux={store.data} />, document.getElementById('tableaux'));
