var React = require('react');
var PureRenderMixin = require('react/addons').addons.PureRenderMixin;
var Cell = require('./Cell.jsx');
var TableauxStateType = require('../tableaux.js').reactType;

var Row = React.createClass({
  mixins : [PureRenderMixin],

  propTypes : {
    row : React.PropTypes.number.isRequired,
    save : React.PropTypes.func.isRequired,
    getColumns : React.PropTypes.func.isRequired,
    getValue : React.PropTypes.func.isRequired
  },

  render : function () {
    var rowId = this.props.row;
    var saveFn = this.props.save;
    var getColumnsFn = this.props.getColumns;
    var getValueFn = this.props.getValue;

    return (
      <tr>
      {getColumnsFn().map(function (column, id) {
        return (<Cell save={saveFn} getValue={getValueFn} kind={column.kind} row={rowId} column={id} />);
      })}
      </tr>
    );
  }
});

module.exports = Row;
