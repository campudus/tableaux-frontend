var React = require('react');
var ReactDOM = require('react-dom');
var Dispatcher = require('../../dispatcher/Dispatcher');
var KeyboardShortcutsMixin = require('../mixins/KeyboardShortcutsMixin');

var GenericOverlay = React.createClass({

  mixins : [KeyboardShortcutsMixin],

  propTypes : {
    body : React.PropTypes.element.isRequired,
    head : React.PropTypes.element,
    type : React.PropTypes.string,
    closeOnBackgroundClicked : React.PropTypes.bool
  },

  getDefaultProps : function () {
    return {
      closeOnBackgroundClicked : true
    };
  },

  allowedTypes : ["full", "flexible", "normal"],
  focusedElementBeforeOverlayOpens : null,

  componentWillMount : function () {
    this.focusedElementBeforeOverlayOpens = document.activeElement;
    document.activeElement.blur();
  },

  componentDidMount : function () {
    document.getElementsByTagName("body")[0].style.overflow = "hidden";
    document.addEventListener('keydown', this.onKeyboardShortcut, true);
    document.addEventListener('mousedown', this.onMouseClick, true);
  },

  componentWillUnmount : function () {
    //Overlay is going to be closed
    document.getElementsByTagName("body")[0].style.overflow = "auto";
    document.removeEventListener('keydown', this.onKeyboardShortcut, true);
    document.removeEventListener('mousedown', this.onMouseClick, true);
    //Reset active element before overlay opened
    if (this.focusedElementBeforeOverlayOpens) {
      this.focusedElementBeforeOverlayOpens.focus();
    }
  },

  onMouseClick : function (event) {
    if (this.props.closeOnBackgroundClicked && (event.target === this.refs.overlayBackground)) {
      Dispatcher.trigger("close-overlay");
    }
  },


  getKeyboardShortcuts : function (event) {
    var self = this;
    return {
      escape : function (event) {
        event.preventDefault();
        Dispatcher.trigger("close-overlay");
      }
    };
  },

  render : function () {
    var overlayType = this.props.type || "normal"; //default to normal
    var overlayWrapperClass = "ignore-react-onclickoutside open " + overlayType;

    if (this.allowedTypes.indexOf(overlayType) === -1) {
      console.error("GenericOverlay type is not valid! Given type is:", overlayType, "Check GenericOverlay.");
      return null;
    }

    return (
      <div id="overlay" className={overlayWrapperClass} tabIndex="1">
        <div id="overlay-wrapper">
          <h2>{this.props.head}</h2>
          <div className="content-scroll">
            <div id="overlay-content">
              {this.props.body}
            </div>
          </div>
        </div>
        <div ref="overlayBackground" onClick={this.closeOverlay} className="background"></div>
      </div>
    );
  }
});

module.exports = GenericOverlay;
