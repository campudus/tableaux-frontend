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
    console.log('render link', this.props.cell);
    return (
      <td className="cell link">
        {this.props.cell.value.map(function (e, i) {
          return <span onClick={self.linkClick(e, i)}>{e.value}</span>;
        })}
        <SearchLink cell={this.props.cell}/>
      </td>
    );
  }

});

module.exports = Cell;
