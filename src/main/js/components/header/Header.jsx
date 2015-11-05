var app = require('ampersand-app');
var React = require('react');
var AmpersandMixin = require('ampersand-react-mixin');

var Dispatcher = require('../../dispatcher/Dispatcher');

var ViewSwitcher = require('./ViewSwitcher.jsx');
var Settings = require('./Settings.jsx');

var Header = React.createClass({

  propTypes : {
    title : React.PropTypes.string.isRequired,
    subtitle : React.PropTypes.string.isRequired,
    langtag : React.PropTypes.string.isRequired
  },

  render : function () {
    var title = this.props.title;
    var subtitle = this.props.subtitle;

    return (
      <header>
        <div id="logo">
          <img src="/img/logo.png" alt=""/>
        </div>

        <div id="view-headline">
          <span>{subtitle}</span>

          <h2>{title}</h2>
        </div>

        <div id="settings-panel">
          <ViewSwitcher langtag={this.props.langtag} />
          <Settings langtag={this.props.langtag} />
        </div>
      </header>
    )
  }
});

module.exports = Header;