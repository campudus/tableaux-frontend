var React = require('react');
var Dispatcher = require('../../dispatcher/Dispatcher');
var KeyboardShortcutsMixin = require('../mixins/KeyboardShortcutsMixin');
var ActionCreator = require('../../actions/ActionCreator');

//TODO: Callback before closing overlay
var GenericOverlay = React.createClass({

  mixins : [KeyboardShortcutsMixin],

  propTypes : {
    body : React.PropTypes.element.isRequired,
    head : React.PropTypes.element,
    footer : React.PropTypes.element,
    type : React.PropTypes.string,
    closeOnBackgroundClicked : React.PropTypes.bool
  },

  getDefaultProps : function () {
    return {
      closeOnBackgroundClicked : true
    };
  },

  allowedTypes : ["full-flex", "flexible", "normal"],
  focusedElementBeforeOverlayOpens : null,

  componentWillMount : function () {
    this.focusedElementBeforeOverlayOpens = document.activeElement;
  },

  componentDidMount : function () {
    document.getElementsByTagName("body")[0].style.overflow = "hidden";
  },

  componentWillUnmount : function () {
    //Overlay is going to be closed
    document.getElementsByTagName("body")[0].style.overflow = "auto";

    //Reset active element before overlay opened
    if (this.focusedElementBeforeOverlayOpens) {
      this.focusedElementBeforeOverlayOpens.focus();
    }
  },

  closeOverlay : function (event) {
    if (this.props.closeOnBackgroundClicked) {
      ActionCreator.closeOverlay();
    }
  },

  //FIXME: Isolated tabbing to prevent tabbing into browser url bar
  getKeyboardShortcuts : function (event) {
    var self = this;
    return {
      escape : function (event) {
        if (self.props.closeOnBackgroundClicked) {
          event.preventDefault();
          ActionCreator.closeOverlay();
        }
      },
      always : function (event) {
        event.stopPropagation();
      }
    };
  },

  render : function () {
    var overlayType = this.props.type || "normal"; //default to normal
    var footer = this.props.footer;
    var hasFooterClass = "";
    if (footer) {
      footer = <footer>{footer}</footer>;
      hasFooterClass = " has-footer";
    }
    var overlayWrapperClass = "ignore-react-onclickoutside open " + overlayType + hasFooterClass;

    if (this.allowedTypes.indexOf(overlayType) === -1) {
      console.error("GenericOverlay type is not valid! Given type is:", overlayType, "Check GenericOverlay.");
      return null;
    }

    return (
      <div id="overlay" className={overlayWrapperClass} tabIndex="1" onKeyDown={this.onKeyboardShortcut}>
        <div id="overlay-wrapper">
          <h2 className="overlay-header">{this.props.head}</h2>
          <div className="content-scroll">
            <div id="overlay-content">
              {this.props.body}
            </div>
          </div>
          {footer}
        </div>
        <div ref="overlayBackground" onClick={this.closeOverlay} className="background"></div>
      </div>
    );
  }
});

module.exports = GenericOverlay;
