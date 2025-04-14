import React, { Component } from "react";
import PropTypes from "prop-types";
import ReactDOM from "react-dom";
import KeyboardShortcutsHelper from "../../helpers/KeyboardShortcutsHelper";
import classNames from "classnames";
import Header from "./Header";
import Footer from "./Footer";
import InfoBox from "./InfoBox";
import * as f from "lodash/fp";
import { maybe, merge } from "../../helpers/functools";
import { when } from "../../helpers/functools";
import { isCell } from "../../specs/cell-spec";
import store from "../../redux/store";
import actions from "../../redux/actionCreators";

const FRAME_DELAY = (1000 / 60) | 0; // ms delay between frames at 60 fps

class GenericOverlay extends Component {
  static propTypes = {
    head: PropTypes.element.isRequired,
    body: PropTypes.element.isRequired,
    footer: PropTypes.element,
    title: PropTypes.any,
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
      registerForEvent: this.registerChildForEvent,
      actions: props.actions
    };

    this.state = {
      sharedDataContainer: {},
      contentHeight: 0,
      contentWidth: 0,
      overlayIsNew: true,
      childrenProps: {
        head: merge(f.get("props", props.head), sharedProps),
        body: merge(f.get("props", props.body), sharedProps),
        footer: f.assoc(f.get(["footer", "props"], props), sharedProps)
      }
    };

    this.allowedTypes = ["normal", "full-height"];
    this.focusedElementBeforeOverlayOpens = null;
    this.childrenEventHandlers = {};

    window.setTimeout(() => this.setState({ overlayIsNew: false }), 400);
  }

  componentWillMount = () => {
    this.focusedElementBeforeOverlayOpens = document.activeElement;
  };

  componentDidMount = () => {
    // need .contains of real dom node
    // eslint-disable-next-line react/no-find-dom-node
    const overlayDOMNode = ReactDOM.findDOMNode(
      f.last(document.getElementsByClassName("overlay"))
    );
    const focusedElement = document.activeElement;

    // Is current focus is this overlay or inside of overlay don't change the focus.
    if (
      !focusedElement ||
      !overlayDOMNode.contains(focusedElement) ||
      focusedElement.isEqualNode(overlayDOMNode)
    ) {
      maybe(overlayDOMNode).method("focus");
    }
  };

  componentWillUnmount = () => {
    // Overlay is going to be closed
    document.getElementsByTagName("body")[0].style.overflow = "auto";
    // Reset active element before overlay opened
    maybe(this.focusedElementBeforeOverlayOpens).method("focus");
  };

  backgroundClick = event => {
    event.stopPropagation();
    this.props.actions.closeOverlay(this.props.id);
  };

  // FIXME: Isolated tabbing to prevent tabbing into browser url bar
  getKeyboardShortcuts = () => {
    return merge(
      {
        escape: event => {
          event.preventDefault();
          event.stopPropagation();
          this.props.actions.closeOverlay();
        },
        always: event => {
          event.stopPropagation();
        }
      },
      this.props.keyboardShortcuts
    );
  };

  registerChildForEvent = ({ type, handler }) => {
    const handlersForType = f.defaultTo([], this.childrenEventHandlers[type]);
    this.childrenEventHandlers[type] = [...handlersForType, handler];
  };

  passOnEvents = type => event => {
    const handlersForType = f.defaultTo([], this.childrenEventHandlers[type]);
    f.map(handler => handler(event), handlersForType);
  };

  updateSharedData = fn => {
    this.setState(({ sharedDataContainer }) => ({
      sharedDataContainer: fn(sharedDataContainer)
    }));
  };

  render() {
    const overlayType = f.contains(this.props.type, this.allowedTypes)
      ? this.props.type
      : "normal";

    const { footer, head, body, isOnTop, specialClass, title } = this.props;
    const { childrenProps, sharedDataContainer } = this.state;
    const overlayWrapperClass = classNames("overlay open", {
      "has-footer": footer,
      active: isOnTop,
      "header-components": head.props.components,
      "header-buttons": head.props.actions,
      [this.props.classNames]: this.props.classNames
    });
    const wrapperClass = classNames(
      `overlay-wrapper ${overlayType} ${this.props.classes ||
        ""} ${specialClass || ""}`,
      {
        "is-new": this.state.overlayIsNew,
        "is-right": this.props.preferRight,
        "header-components": head.props.components,
        "header-buttons": head.props.actions
      }
    );

    const dataShare = {
      sharedData: sharedDataContainer,
      updateSharedData: this.updateSharedData
    };

    const additionalProps = f.omit(
      [
        "head",
        "foot",
        "title",
        "body",
        "classes",
        "type",
        "isOnTop",
        "specialClass"
      ],
      this.props
    );

    return (
      <div
        className={overlayWrapperClass}
        tabIndex="1"
        onKeyDown={KeyboardShortcutsHelper.onKeyboardShortcut(
          this.getKeyboardShortcuts
        )}
      >
        <div
          className={wrapperClass}
          onScroll={f.throttle(FRAME_DELAY, this.passOnEvents("scroll"))}
        >
          {React.cloneElement(
            head,
            when(() => isCell(title), f.assoc("title", title), {
              ...childrenProps.head,
              ...dataShare,
              ...additionalProps
            })
          )}
          <div className="overlay-content">
            {React.cloneElement(body, {
              ...childrenProps.body,
              ...dataShare,
              ...additionalProps
            })}
          </div>
          {footer ? (
            <footer>
              {React.cloneElement(footer, {
                ...childrenProps.footer,
                ...dataShare,
                ...additionalProps
              })}
            </footer>
          ) : null}
        </div>
        <div onClick={this.backgroundClick} className="background" />
      </div>
    );
  }
}

const showDialog = ({
  type = "default",
  context = "Action",
  title,
  heading = "",
  message = "",
  buttonActions = {},
  name
}) => {
  const reduxActions = {
    closeOverlay: (...args) => store.dispatch(actions.closeOverlay(...args)),
    openOverlay: (...args) => store.dispatch(actions.openOverlay(...args))
  };
  const wrapActionFn = fn => event => {
    if (f.isFunction(fn)) {
      fn(event);
    }
    reduxActions.closeOverlay();
  };

  const enterKeyFn = f.flow(
    f.props(["positive", "negative", "neutral"]),
    f.find(f.identity),
    f.nth(1),
    wrapActionFn
  )(buttonActions);

  const escKeyFn = f.flow(f.get(["neutral", 1]), wrapActionFn)(buttonActions);

  const keyShortcuts = {
    enter: event => {
      event.preventDefault();
      enterKeyFn(event);
      event.stopPropagation();
    },
    escape: event => {
      event.preventDefault();
      escKeyFn(event);
      event.stopPropagation();
    }
  };

  reduxActions.openOverlay({
    head: <Header context={context} title={title} />,
    body: <InfoBox heading={heading} message={message} type={type} />,
    footer: <Footer buttonActions={buttonActions} />,
    keyboardShortcuts: keyShortcuts,
    name
  });
};

export default GenericOverlay;
export { showDialog };
