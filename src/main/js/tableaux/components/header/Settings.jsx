var app = require('ampersand-app');
var React = require('react');
var AmpersandMixin = require('ampersand-react-mixin');
var Dispatcher = require('../../Dispatcher');

var Header = React.createClass({

  render : function () {
    return (
      <div id="settings">
        <div id="settings-content">
          <ul>
            <li><i className="fa fa-table icon"></i><a href="/table">Tables</a></li>
            <li><i className="fa fa-file-image-o icon"></i><a href="/media">Media</a></li>
          </ul>
        </div>
      </div>
    )
  }
});

module.exports = Header;