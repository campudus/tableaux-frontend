import React, {PropTypes, Component} from "react";
import ReactDOM from "react-dom";
import ActionCreator from "../../actions/ActionCreator";
import {merge, contains, isEmpty, isNull} from "lodash/fp";
import KeyboardShortcutsHelper from "../../helpers/KeyboardShortcutsHelper";
import classNames from "classnames";

// TODO: Callback before closing overlay
class GenericOverlay extends Component {

  static propTypes = {
    // body : React.PropTypes.element.isRequired,
    head: PropTypes.element,
    footer: PropTypes.element,
    type: PropTypes.string,
    keyboardShortcuts: PropTypes.object,
    closeOnBackgroundClicked: PropTypes.bool,
    showBackButton: PropTypes.bool
  };

  constructor(props) {
    super(props);
    console.log("Overlay props:", props)
    this.state = {
      contentHeight: 0,
      contentWidth: 0
    };

    this.allowedTypes = ["full-flex", "flexible", "normal", "no-scroll"];
    this.focusedElementBeforeOverlayOpens = null;
  }

  componentWillMount= () => {
    this.focusedElementBeforeOverlayOpens = document.activeElement;
  };

  recalculateContentDimensions = () => {
    console.log("recalculate");
    const overlayContent = ReactDOM.findDOMNode(this.refs.overlayContent);
    const style = window.getComputedStyle(overlayContent, null);
    const innerWidth = overlayContent.clientWidth - parseInt(style.getPropertyValue("padding-left")) - parseInt(style.getPropertyValue(
        "padding-right"));
    const innerHeight = overlayContent.clientHeight - parseInt(style.getPropertyValue("padding-top")) - parseInt(style.getPropertyValue(
        "padding-bottom"));

    this.setState({
      contentHeight: innerHeight,
      contentWidth: innerWidth
    });
  };

  componentDidMount = () => {
    document.getElementsByTagName("body")[0].style.overflow = "hidden";

    const overlayDOMNode = ReactDOM.findDOMNode(this);
    const focusedElement = document.activeElement;

    // Is current focus is this overlay or inside of overlay don't change the focus.
    if (!focusedElement || !overlayDOMNode.contains(focusedElement) || focusedElement.isEqualNode(overlayDOMNode)) {
      overlayDOMNode.focus();
    }

    window.addEventListener("resize", this.handleResize);
    this.handleResize();
  };

  componentWillUnmount= () => {
    // Overlay is going to be closed
    document.getElementsByTagName("body")[0].style.overflow = "auto";
    window.removeEventListener("resize", this.handleResize);

    // Reset active element before overlay opened
    if (this.focusedElementBeforeOverlayOpens) {
      this.focusedElementBeforeOverlayOpens.focus();
    }
  };

  handleResize = (event) => {
    this.recalculateContentDimensions();
  };

  backgroundClick = (event) => {
    if (this.props.closeOnBackgroundClicked !== false) {
      ActionCreator.closeOverlay();
    }
  };

  // FIXME: Isolated tabbing to prevent tabbing into browser url bar
  getKeyboardShortcuts = (event) => {
    return merge(
      {
        escape: (event) => {
          event.preventDefault();
          ActionCreator.closeOverlay();
        },
        always: (event) => {
          event.stopPropagation();
        }
      },
      this.props.keyboardShortcuts
    );
  };

  renderChildren = (props) => {
    const {contentHeight, contentWidth} = this.state;
    return React.Children.map(props.children, child => {
      return React.cloneElement(child,
        {
          contentHeight,
          contentWidth
        });
    });
  };

  render() {
    const overlayType = this.props.type || "normal"; // default to normal
    if (!contains(overlayType, this.allowedTypes)) {
      console.error("GenericOverlay type is not valid! Given type is:", overlayType, "Check GenericOverlay.");
      return null;
    }

    const {footer, showBackButton} = this.props;
    const overlayWrapperClass = classNames("open " + overlayType, {
      "has-footer": footer,
      [this.props.classNames]: this.props.classNames
    });

    return (
      <div id="overlay" className={overlayWrapperClass} tabIndex="1"
           onKeyDown={KeyboardShortcutsHelper.onKeyboardShortcut(this.getKeyboardShortcuts)}>
        <div id="overlay-wrapper">
          <div className="header-wrapper">
            <h2 className="overlay-header">{this.props.head}</h2>
            {(showBackButton)
              ? (
                <a className="button back-button" href="#" onClick={() => ActionCreator.closeOverlay()} >
                  <i className="fa fa-arrow-circle-left" />
                </a>
              )
              : null
            }
          </div>
          <div className="content-scroll">
            <div id="overlay-content" ref="overlayContent">
              {this.renderChildren(this.props)}
            </div>
          </div>
          {(footer) ? <footer>{footer}</footer> : null}
        </div>
        <div ref="overlayBackground" onClick={this.backgroundClick} className="background"></div>
      </div>
    );
  }
}

module.exports = GenericOverlay;
