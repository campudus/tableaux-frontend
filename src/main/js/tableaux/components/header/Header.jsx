var app = require('ampersand-app');
var React = require('react');
var AmpersandMixin = require('ampersand-react-mixin');
var Dispatcher = require('../../Dispatcher');

var ViewSwitcher = require('./ViewSwitcher.jsx');
var Settings = require('./Settings.jsx');

var Header = React.createClass({

  render : function () {
    var name = this.props.tables.get(this.props.currentId).name;

    return (
      <header>
        <div id="logo">
          <img src="/img/logo.png" alt=""/>
        </div>

        <div id="view-headline">
          <span>Sie arbeiten in der Tabelle</span>

          <h2>{name}</h2>
        </div>

        <div id="settings-panel">
          <ViewSwitcher />
          <Settings />
        </div>
      </header>
    )
  }
});

module.exports = Header;