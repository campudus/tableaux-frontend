var React = require('react');

var LabelLinkCell = React.createClass({

  render : function () {
    return <span className="link" onClick={this.props.click}>{this.props.element.value}</span>;
  }

});

module.exports = LabelLinkCell;
