var React = require('react');

var Cell = React.createClass({
  render: function() {
    return (
      <td className="cell">
        {this.props.value}
      </td>
    );
  }
});

module.exports = Cell;
