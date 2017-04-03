import React, {Component, PropTypes} from "react";
import ReactDOM from "react-dom";
import ActionCreator from "../../actions/ActionCreator";
import {contains, isEmpty, isNull, merge, props, prop, nth, noop, last} from "lodash/fp";
import KeyboardShortcutsHelper from "../../helpers/KeyboardShortcutsHelper";
import classNames from "classnames";
import Header from "./Header";
import Footer from "./Footer";
import InfoBox from "./InfoBox";

// TODO: Callback before closing overlay
class GenericOverlay extends Component {

  static propTypes = {
    // body : React.PropTypes.element.isRequired,
    head: PropTypes.element.isRequired,
    body: PropTypes.element.isRequired,
    footer: PropTypes.element,
    type: PropTypes.string,
    isOnTop: PropTypes.bool.isRequired,
    keyboardShortcuts: PropTypes.object
  };

  constructor(props) {
    super(props);
    this.state = {
      contentHeight: 0,
      contentWidth: 0
    };

    this.allowedTypes = ["normal", "full-height"];
    this.focusedElementBeforeOverlayOpens = null;
  }

  componentWillMount = () => {
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
    const overlayDOMNode = ReactDOM.findDOMNode(last(document.getElementsByClassName("overlay")));
    const focusedElement = document.activeElement;

    // Is current focus is this overlay or inside of overlay don't change the focus.
    if (!focusedElement || !overlayDOMNode.contains(focusedElement) || focusedElement.isEqualNode(overlayDOMNode)) {
      overlayDOMNode.focus();
    }

    window.addEventListener("resize", this.handleResize);
    this.handleResize();
  };

  componentWillUnmount = () => {
    // Overlay is going to be closed
    document.getElementsByTagName("body")[0].style.overflow = "auto";
    window.removeEventListener("resize", this.handleResize);

    // Reset active element before overlay opened
    if (this.focusedElementBeforeOverlayOpens) {
      this.focusedElementBeforeOverlayOpens.focus();
    }
  };

  handleResize = (event) => {
    //this.recalculateContentDimensions();
  };

  backgroundClick = (event) => {
    event.stopPropagation();
    ActionCreator.closeOverlay();
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

  render() {
    const overlayType = (contains(this.props.type, this.allowedTypes))
      ? this.props.type
      : "normal";

    const {footer, head, body, isOnTop} = this.props;
    const overlayWrapperClass = classNames("overlay open", {
      "has-footer": footer,
      "active": isOnTop,
      [this.props.classNames]: this.props.classNames
    });

    return (
      <div className={overlayWrapperClass} tabIndex="1"
           onKeyDown={KeyboardShortcutsHelper.onKeyboardShortcut(this.getKeyboardShortcuts)}
      >
        <div className={"overlay-wrapper " + overlayType} onClick={event => { event.stopPropagation(); event.preventDefault(); }}>
          {head}
          <div className="overlay-content">
            {body}
          </div>
          {(footer) ? <footer>{footer}</footer> : null}
        </div>
        <div ref="overlayBackground" onClick={this.backgroundClick} className="background" />
      </div>
    );
  }
}

const showDialog = ({type = "default", context = "Action", title, heading = "", message = "", actions = {}}) => {
  const enterKeyFn = nth(1)(prop("positive", actions)) || nth(1)(prop("negative", actions)) || prop("neutral", actions);
  const escKeyFn = nth(1)(prop("neutral", actions));
  const keyShortcuts = {
    enter: event => {
      event.preventDefault();
      (enterKeyFn || noop)();
      ActionCreator.closeOverlay();
      event.stopPropagation();
    },
    escape: event => {
      event.preventDefault();
      (escKeyFn || noop)();
      ActionCreator.closeOverlay();
      event.stopPropagation();
    }
  };
  ActionCreator.openOverlay(
    {
      head: <Header context={context} title={title} />,
      body: <InfoBox heading={heading} message={message} type={type} />,
      footer: <Footer actions={actions} />,
      keyboardShortcuts: keyShortcuts
    }
  )
};

export default GenericOverlay;
export {showDialog}
