import React, {PureComponent} from "react";
import PropTypes from "prop-types";
import ReactDOM from "react-dom";
import ActionCreator from "../../actions/ActionCreator";
import KeyboardShortcutsHelper from "../../helpers/KeyboardShortcutsHelper";
import classNames from "classnames";
import Header from "./Header";
import Footer from "./Footer";
import InfoBox from "./InfoBox";
import * as f from "lodash/fp";
import Dispatcher from "../../dispatcher/Dispatcher";
import {ActionTypes} from "../../constants/TableauxConstants";
import {maybe} from "../../helpers/functools";

const FRAME_DELAY = (1000 / 60) | 0; // ms delay between frames at 60 fps

class GenericOverlay extends PureComponent {

  static propTypes = {
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

    const sharedProps = {
      id: props.id,
      registerForEvent: this.registerChildForEvent
    };

    this.state = {
      sharedDataContainer: {},
      contentHeight: 0,
      contentWidth: 0,
      overlayIsNew: true,
      childrenProps: {
        head: f.merge(f.get("props", props.head), sharedProps),
        body: f.merge(f.get("props", props.body), sharedProps),
        footer: f.assoc(f.get(["footer", "props"], props), sharedProps)
      }
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
    const overlayDOMNode = ReactDOM.findDOMNode(f.last(document.getElementsByClassName("overlay")));
    const focusedElement = document.activeElement;

    // Is current focus is this overlay or inside of overlay don't change the focus.
    if (!focusedElement || !overlayDOMNode.contains(focusedElement) || focusedElement.isEqualNode(overlayDOMNode)) {
      maybe(overlayDOMNode).method("focus");
    }

    Dispatcher.on(ActionTypes.UPDATE_OVERLAY, this.updateChildrenProps);
  };

  componentWillUnmount = () => {
    // Overlay is going to be closed
    document.getElementsByTagName("body")[0].style.overflow = "auto";
    Dispatcher.off(ActionTypes.UPDATE_OVERLAY, this.updateChildrenProps);

    // Reset active element before overlay opened
    maybe(this.focusedElementBeforeOverlayOpens).method("focus");
  };

  backgroundClick = (event) => {
    event.stopPropagation();
    ActionCreator.closeOverlay();
  };

  // FIXME: Isolated tabbing to prevent tabbing into browser url bar
  getKeyboardShortcuts = (event) => {
    return f.merge(
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
    const handlersForType = f.defaultTo([], this.childrenEventHandlers[type]);
    this.childrenEventHandlers[type] = [...handlersForType, handler];
  };

  passOnEvents = type => event => {
    const handlersForType = f.defaultTo([], this.childrenEventHandlers[type]);
    f.map(handler => handler(event), handlersForType);
  };

  updateChildrenProps = ({id, props}) => {
    if (id !== this.props.id) {
      return;
    }
    const modifiedProps = f.keys(props);
    const updatedProps = childIdString => {
      const existingProps = f.get(childIdString, this.state.childrenProps);
      const existingKeys = f.intersection(modifiedProps, existingProps);
      return f.merge(
        existingProps,
        f.fromPairs(
          f.zip(existingKeys, f.props(existingKeys, props))
        )
      );
    };

    this.setState({childrenProps: {
      head: updatedProps("head"),
      body: updatedProps("body"),
      footer: updatedProps("footer")
    }}, () => window.devLog("updated children props to", this.state.childrenProps));
  };

  updateSharedData = (fn) => {
    this.setState(({sharedDataContainer}) => ({sharedDataContainer: fn(sharedDataContainer)}));
  };

  render() {
    const overlayType = (f.contains(this.props.type, this.allowedTypes))
      ? this.props.type
      : "normal";

    const {footer, head, body, isOnTop, specialClass} = this.props;
    const {childrenProps, sharedDataContainer} = this.state;
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

    const dataShare = {
      sharedData: sharedDataContainer,
      updateSharedData: this.updateSharedData
    };

    return (
      <div className={overlayWrapperClass} tabIndex="1"
           onKeyDown={KeyboardShortcutsHelper.onKeyboardShortcut(this.getKeyboardShortcuts)}
      >
        <div className={wrapperClass}
             onClick={event => {
               event.stopPropagation();
               event.preventDefault();
             }}
             onScroll={f.throttle(FRAME_DELAY, this.passOnEvents("scroll"))}
        >
          {React.cloneElement(head, {...childrenProps.head, ...dataShare})}
          <div className="overlay-content">
            {React.cloneElement(body, {...childrenProps.body, ...dataShare})}
          </div>
          {(footer)
            ? <footer>{React.cloneElement(footer, {...childrenProps.footer, ...dataShare})}</footer>
            : null
          }
        </div>
        <div ref="overlayBackground" onClick={this.backgroundClick} className="background" />
      </div>
    );
  }
}

const showDialog = ({type = "default", context = "Action", title, heading = "", message = "", actions = {}, name}) => {
  const enterKeyFn = f.nth(1)(f.prop("positive", actions)) || f.nth(1)(f.prop("negative", actions)) || f.prop("neutral", actions);
  const escKeyFn = f.nth(1)(f.prop("neutral", actions));
  const keyShortcuts = {
    enter: event => {
      event.preventDefault();
      (enterKeyFn || f.noop)();
      ActionCreator.closeOverlay();
      event.stopPropagation();
    },
    escape: event => {
      event.preventDefault();
      (escKeyFn || f.noop)();
      ActionCreator.closeOverlay();
      event.stopPropagation();
    }
  };
  ActionCreator.openOverlay(
    {
      head: <Header context={context} title={title} />,
      body: <InfoBox heading={heading} message={message} type={type} />,
      footer: <Footer actions={actions} />,
      keyboardShortcuts: keyShortcuts,
      name
    }
  );
};

export default GenericOverlay;
export {showDialog};
