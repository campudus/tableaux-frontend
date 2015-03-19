var React = require('react');
var PureRenderMixin = require('react/addons').addons.PureRenderMixin;
var Cell = require('./Cell.jsx');
var TableauxStateType = require('../tableaux.js').reactType;

var Row = React.createClass({
  mixins : [PureRenderMixin],

  propTypes : {
    cells : React.PropTypes.arrayOf(React.PropTypes.shape({
      kind : React.PropTypes.string.isRequired,
      content : React.PropTypes.any,
      editing : React.PropTypes.bool
    })).isRequired,
    row : React.PropTypes.number.isRequired,
    save : React.PropTypes.func.isRequired
  },

  render : function () {
    var rowId = this.props.row;
    var cells = this.props.cells;
    var saveFn = this.props.save;

    return (
      <tr>
      {cells.map(function (data, columnId) {
        return (<Cell save={saveFn} cell={data} row={rowId} column={columnId} />);
      })}
      </tr>
    );
  }
});

module.exports = Row;
