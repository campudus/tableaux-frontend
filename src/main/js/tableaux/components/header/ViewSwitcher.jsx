var app = require('ampersand-app');
var React = require('react');
var AmpersandMixin = require('ampersand-react-mixin');
var Dispatcher = require('../../Dispatcher');

var Header = React.createClass({

  render : function () {
    return (
      <div id="switch-view">
        <span className="opener">Ansicht wechseln <i className="fa fa-columns"></i></span>

        <div id="select-view">
          <ul>
            <li>Coming</li>
            <li>Soon</li>
            <li>Olli</li>
          </ul>
        </div>

      </div>
    )
  }
});

module.exports = Header;