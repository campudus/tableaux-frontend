var React = require("react");
var ReactDOM = require("react-dom");
var Dispatcher = require("../../dispatcher/Dispatcher");
var ActionCreator = require("../../actions/ActionCreator");
var LinkOverlay = require("../../components/cells/link/LinkOverlay");
import {merge} from "lodash/fp";
import KeyboardShortcutsHelper from "../../helpers/KeyboardShortcutsHelper";

// TODO: Callback before closing overlay
var GenericOverlay = React.createClass({

  propTypes: {
    // body : React.PropTypes.element.isRequired,
    head: React.PropTypes.element,
    footer: React.PropTypes.element,
    type: React.PropTypes.string,
    keyboardShortcuts: React.PropTypes.object,
    closeOnBackgroundClicked: React.PropTypes.bool
  },

  getInitialState: function () {
    return {
      contentHeight: 0,
      contentWidth: 0
    };
  },

  getDefaultProps: function () {
    return {
      closeOnBackgroundClicked: true
    };
  },

  allowedTypes: ["full-flex", "flexible", "normal", "no-scroll"],
  focusedElementBeforeOverlayOpens: null,

  componentWillMount: function () {
    this.focusedElementBeforeOverlayOpens = document.activeElement;
  },

  recalculateContentDimensions: function () {
    console.log("recalculate");
    const overlayContent = ReactDOM.findDOMNode(this.refs.overlayContent);
    const style = window.getComputedStyle(overlayContent, null);
    const innerWidth = overlayContent.clientWidth - parseInt(style.getPropertyValue("padding-left")) - parseInt(style.getPropertyValue("padding-right"));
    const innerHeight = overlayContent.clientHeight - parseInt(style.getPropertyValue("padding-top")) - parseInt(style.getPropertyValue("padding-bottom"));

    this.setState({
      contentHeight: innerHeight,
      contentWidth: innerWidth
    });
  },

  componentDidMount: function () {
    document.getElementsByTagName("body")[0].style.overflow = "hidden";

    const overlayDOMNode = ReactDOM.findDOMNode(this);
    const focusedElement = document.activeElement;

    // Is current focus is this overlay or inside of overlay don't change the focus.
    if (!focusedElement || !overlayDOMNode.contains(focusedElement) || focusedElement.isEqualNode(overlayDOMNode)) {
      overlayDOMNode.focus();
    }

    window.addEventListener("resize", this.handleResize);
    this.handleResize();
  },

  componentWillUnmount: function () {
    // Overlay is going to be closed
    document.getElementsByTagName("body")[0].style.overflow = "auto";
    window.removeEventListener("resize", this.handleResize);

    // Reset active element before overlay opened
    if (this.focusedElementBeforeOverlayOpens) {
      this.focusedElementBeforeOverlayOpens.focus();
    }
  },

  handleResize: function (event) {
    this.recalculateContentDimensions();
  },

  closeOverlay: function (event) {
    if (this.props.closeOnBackgroundClicked) {
      ActionCreator.closeOverlay();
    }
  },

  // FIXME: Isolated tabbing to prevent tabbing into browser url bar
  getKeyboardShortcuts: function (event) {
    var self = this;
    return merge(
      {
        escape: function (event) {
          if (self.props.closeOnBackgroundClicked) {
            event.preventDefault();
            ActionCreator.closeOverlay();
          }
        },
        always: function (event) {
          event.stopPropagation();
        }
      },
      this.props.keyboardShortcuts
    );
  },

  renderChildren(props) {
    let {contentHeight, contentWidth} = this.state;
    return React.Children.map(props.children, child => {
      return React.cloneElement(child, {contentHeight, contentWidth});
    });
  },

  render: function () {
    var overlayType = this.props.type || "normal"; // default to normal
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
      <div id="overlay" className={overlayWrapperClass} tabIndex="1"
           onKeyDown={KeyboardShortcutsHelper.onKeyboardShortcut(this.getKeyboardShortcuts)}>
        <div id="overlay-wrapper">
          <h2 className="overlay-header">{this.props.head}</h2>
          <div className="content-scroll">
            <div id="overlay-content" ref="overlayContent">
              {this.renderChildren(this.props)}
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
