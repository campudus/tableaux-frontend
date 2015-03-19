var React = require('react');
var PureRenderMixin = require('react/addons').addons.PureRenderMixin;
var Cell = require('./Cell.jsx');
var TableauxStateType = require('../tableaux.js').reactType;

var Row = React.createClass({
  mixins : [PureRenderMixin],

  propTypes : {
    tableaux : TableauxStateType,
    row : React.PropTypes.number.isRequired
  },

  render : function () {
    var rowId = this.props.row;
    var tableaux = this.props.tableaux;

    return (
      <tr>
      {tableaux[rowId].map(function (data, columnId) {
        return (<Cell tableaux={tableaux} row={rowId} column={columnId} />);
      })}
      </tr>
    );
  }
});

module.exports = Row;
