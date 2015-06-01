var React = require('react');

var Cell = React.createClass({

  render : function () {
    return <span className="link" onClick={this.props.click}>{this.props.element.value}</span>;
  }

});

module.exports = Cell;
