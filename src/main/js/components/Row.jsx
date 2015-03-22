var React = require('react');
var PureRenderMixin = require('react/addons').addons.PureRenderMixin;
var Cell = require('./Cell.jsx');
var TableauxStateType = require('../tableaux.js').reactType;

var Row = React.createClass({
  mixins : [PureRenderMixin],

  propTypes : {
    kind : React.PropTypes.string.isRequired,
    row : React.PropTypes.number.isRequired,
    save : React.PropTypes.func.isRequired,
    getRow : React.PropTypes.func.isRequired,
    getValue : React.PropTypes.func.isRequired
  },

  render : function () {
    var rowId = this.props.row;
    var saveFn = this.props.save;
    var getRowFn = this.props.getRow(rowId);
    var getValueFn = this.props.getValue;

    return (
      <tr>
      {getRowFn().map(function (data, columnId) {
        return (<Cell save={saveFn} getValue={getValueFn} row={rowId} column={columnId} />);
      })}
      </tr>
    );
  }
});

module.exports = Row;
