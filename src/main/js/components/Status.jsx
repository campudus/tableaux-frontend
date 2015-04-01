var React = require('react');
var PureRenderMixin = require('react/addons').addons.PureRenderMixin;

var TableSwitcher = React.createClass({
  propTypes : {
    status : React.PropTypes.shape({
      text : React.PropTypes.string.isRequired,
      kind : React.PropTypes.string.isRequired
    }).isRequired
  },

  render : function () {
    return (
      <div className={this.props.status.kind}>{this.props.status.text}</div>
    );
  }
});

module.exports = TableSwitcher;
