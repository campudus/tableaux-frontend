var React = require('react');

var PageTitle = React.createClass({

  propTypes : {
    title : React.PropTypes.string.isRequired
  },

  render : function () {
    return (
      <div id="header-pagename">{this.props.title}</div>
    )
  }

});

module.exports = PageTitle;