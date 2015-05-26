var React = require('react');

var Cell = React.createClass({

  render : function () {
    return (
      <td className="cell" onClick={this.props.onClick}>
        {this.props.cell.value}
      </td>
    );
  }

});

module.exports = Cell;
