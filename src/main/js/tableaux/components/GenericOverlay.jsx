var React = require('react');
var AmpersandMixin = require('ampersand-react-mixin');
var _ = require('lodash');

var Dispatcher = require('../Dispatcher');

var GenericOverlay = React.createClass({
  mixins : [AmpersandMixin],

  getInitialState : function () {
    return {open : false, content : {}, type : "normal"};
  },

  componentWillMount : function () {
    Dispatcher.on('openGenericOverlay', this.openOverlay);
    Dispatcher.on('closeGenericOverlay', this.closeOverlay);
  },

  componentWillUnmount : function () {
    Dispatcher.off('openGenericOverlay');
    Dispatcher.off('closeGenericOverlay');
  },

  openOverlay : function (content, type) {
    var _type = "normal";
    if (typeof type !== 'undefined') {
      _type = type
    }

    this.setState({
      open : true,
      content : content,
      type : _type
    });
  },

  closeOverlay : function () {
    this.stopListening();

    this.setState(this.getInitialState());
  },

  renderNormal : function () {
    var body = (
      <div id="overlay-wrapper">
        <h2>{this.state.content.head}</h2>

        <div className="content-scroll">
          <div id="overlay-content">
            {this.state.content.body}
          </div>
        </div>
      </div>
    );

    return (
      <div id="overlay" className="normal open">
        {body}

        <div onClick={this.closeOverlay} className="background"></div>
      </div>
    );
  },

  renderFlexible : function () {
    var body = (
      <div id="overlay-wrapper">
        <h2>{this.state.content.head}</h2>

        <div className="content-scroll">
          <div id="overlay-content">
            {this.state.content.body}
          </div>
        </div>
      </div>
    );

    return (
      <div id="overlay" className="flexible open">
        {body}

        <div onClick={this.closeOverlay} className="background"></div>
      </div>
    );
  },

  render : function () {
    if (!this.state.open) {
      return <div id="overlay" className="closed"/>;
    }

    switch (this.state.type) {
      case "normal":
        return this.renderNormal();
      case "flexible":
        return this.renderFlexible();
      default:
        throw "GenericOverlay type is not valid!";
    }
  }
});

module.exports = GenericOverlay;
