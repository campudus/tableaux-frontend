import React, { Component } from "react";
import PropTypes from "prop-types";
import * as f from "lodash/fp";
import * as Sentry from "@sentry/browser";

class Footer extends Component {
  static propTypes = {
    // compare OverlayHeader
    actions: PropTypes.object,
    buttonActions: PropTypes.object
  };

  wrapButtonFn = (value, fn) => (...args) => {
    Sentry.addBreadcrumb({ message: "Footer button: " + value });
    if (f.isFunction(fn)) {
      fn(...args);
    }
    this.props.actions.closeOverlay();
  };

  render() {
    const { buttonActions } = this.props;

    if (f.isEmpty(buttonActions)) {
      return null;
    } else {
      const [pos, neg, ntr] = f.props(
        ["positive", "negative", "neutral"],
        buttonActions
      );

      const makeButton = (className, [text, fn]) => (
        <a
          className={"button " + className}
          onClick={this.wrapButtonFn(className, fn)}
        >
          {text}
        </a>
      );

      const buttonsItem = (
        <div className="action-buttons">
          {neg ? makeButton("negative", neg) : null}
          {ntr ? makeButton("neutral", ntr) : null}
          {pos ? makeButton("positive", pos) : null}
        </div>
      );

      return <footer className="button-wrapper">{buttonsItem}</footer>;
    }
  }
}

export default Footer;
