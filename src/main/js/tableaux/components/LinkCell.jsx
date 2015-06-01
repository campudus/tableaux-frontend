var React = require('react');
var SearchLink = require('./SearchLink.jsx');

var Cell = React.createClass({

  linkClick : function (e, idx) {
    return function () {
      alert('e=' + e.value);
    };
  },

  render : function () {
    var self = this;
    var cell = this.props.cell;
    return (
      <td className={'cell link cell-' + cell.column.getId() + '-' + cell.rowId}>
        {cell.value.map(function (e, i) {
          return <span key={i} onClick={self.linkClick(e, i)}>{e.value}</span>;
        })}
        <SearchLink cell={cell}/>
      </td>
    );
  }

});

module.exports = Cell;
