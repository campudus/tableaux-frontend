import React, {Component, PropTypes} from "react";
import ReactDOM from "react-dom";
import ActionCreator from "../../actions/ActionCreator";
import {contains, defaultTo, isEmpty, isNull, last, map, merge, noop, nth, prop, props, throttle} from "lodash/fp";
import KeyboardShortcutsHelper from "../../helpers/KeyboardShortcutsHelper";
import classNames from "classnames";
import Header from "./Header";
import Footer from "./Footer";
import InfoBox from "./InfoBox";

const FRAME_DELAY = (1000/60) | 0; // ms delay between frames at 60 fps

class GenericOverlay extends Component {

  static propTypes = {
    // body : React.PropTypes.element.isRequired,
    head: PropTypes.element.isRequired,
    body: PropTypes.element.isRequired,
    footer: PropTypes.element,
    type: PropTypes.string,
    isOnTop: PropTypes.bool.isRequired,
    keyboardShortcuts: PropTypes.object,
    specialClass: PropTypes.string,
    preferRight: PropTypes.bool,
    id: PropTypes.number.isRequired,
    classes: PropTypes.string
  };

  constructor(props) {
    super(props);
    this.state = {
      contentHeight: 0,
      contentWidth: 0,
      overlayIsNew: true
    };

    this.allowedTypes = ["normal", "full-height"];
    this.focusedElementBeforeOverlayOpens = null;
    this.childrenEventHandlers = {};

    window.setTimeout(() => this.setState({overlayIsNew: false}), 400);
  }

  componentWillMount = () => {
    this.focusedElementBeforeOverlayOpens = document.activeElement;
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
          event.stopPropagation();
          ActionCreator.closeOverlay();
        },
        always: (event) => {
          event.stopPropagation();
        }
      },
      this.props.keyboardShortcuts
    );
  };

  registerChildForEvent = ({type, handler}) => {
    const handlersForType = defaultTo([], this.childrenEventHandlers[type]);
    this.childrenEventHandlers[type] = [...handlersForType, handler];
  };

  passOnEvents = type => event => {
    const handlersForType = defaultTo([], this.childrenEventHandlers[type]);
    map(handler => handler(event), handlersForType);
  };

  render() {
    const overlayType = (contains(this.props.type, this.allowedTypes))
      ? this.props.type
      : "normal";

    const {footer, head, body, isOnTop, specialClass} = this.props;
    const overlayWrapperClass = classNames("overlay open", {
      "has-footer": footer,
      "active": isOnTop,
      "header-components": head.props.components,
      "header-buttons": head.props.actions,
      [this.props.classNames]: this.props.classNames
    });
    const wrapperClass = classNames(`overlay-wrapper ${overlayType} ${this.props.classes || ""} ${specialClass || ""}`, {
      "is-new": this.state.overlayIsNew,
      "is-right": this.props.preferRight,
      "header-components": head.props.components,
      "header-buttons": head.props.actions
    });

    return (
      <div className={overlayWrapperClass} tabIndex="1"
           onKeyDown={KeyboardShortcutsHelper.onKeyboardShortcut(this.getKeyboardShortcuts)}
      >
        <div className={wrapperClass}
             onClick={event => {
               event.stopPropagation();
               event.preventDefault();
             }}
             onScroll={throttle(FRAME_DELAY, this.passOnEvents("scroll"))}
        >
          {React.cloneElement(head, {id: this.props.id})}
          <div className="overlay-content">
            {React.cloneElement(body,
              {
                id: this.props.id,
                registerForEvent: this.registerChildForEvent
              })}
          </div>
          {(footer) ? <footer>{React.cloneElement(footer, {id: this.props.id})}</footer> : null}
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
