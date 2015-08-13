var app = require('ampersand-app');
var React = require('react');
var AmpersandMixin = require('ampersand-react-mixin');
var Dispatcher = require('../Dispatcher');

var Header = React.createClass({

  render : function () {
    return (
      <div id="settings">
        <span className="opener"><i className="fa fa-cog"></i></span>

        <div id="settings-content">
          <ul>
            <li><a href="/table">Tables</a></li>
            <li><a href="/media">Media</a></li>
            <li>Hilfe</li>
          </ul>
        </div>
      </div>
    )
  }
});

module.exports = Header;