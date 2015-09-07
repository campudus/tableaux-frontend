var React = require('react');
var Dispatcher = require('../Dispatcher');
var AmpersandMixin = require('ampersand-react-mixin');
var _ = require('lodash');

var GenericOverlay = React.createClass({
  mixins : [AmpersandMixin],

  getInitialState : function () {
    return {open : false, content : {}};
  },

  componentWillMount : function () {
    Dispatcher.on('openGenericOverlay', this.openOverlay);
    Dispatcher.on('closeGenericOverlay', this.closeOverlay);
  },

  componentWillUnmount : function () {
    Dispatcher.off('openGenericOverlay');
    Dispatcher.off('closeGenericOverlay');
  },

  openOverlay : function (content) {
    this.setState({
      open : true,
      content : content
    });
  },

  closeOverlay : function () {
    this.stopListening();

    this.setState(this.getInitialState());
  },

  renderOverlay : function () {
    var self = this;

    var body = "";
    if (this.state.open) {
      body = (
        <div id="overlay-wrapper">
          <h2>{this.state.content.head}</h2>

          <div className="content-scroll">
            <div id="overlay-content">
              {this.state.content.body}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div id="overlay" className={this.state.open ? "open" : "closed"} ref="overlay">
        {body}

        <div onClick={this.closeOverlay} className="background"></div>
      </div>
    );
  },

  render : function () {
    return this.renderOverlay();
  }
});

module.exports = GenericOverlay;
