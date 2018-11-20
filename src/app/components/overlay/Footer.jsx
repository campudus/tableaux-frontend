import React, {Component} from "react";
import PropTypes from "prop-types";
import * as f from "lodash/fp";
// import ActionCreator from "../../actions/ActionCreator";
import Raven from "raven-js";

class Footer extends Component {
  static propTypes = { // compare OverlayHeader
    actions: PropTypes.object
  };

  wrapButtonFn = (value, fn) => (...args) => {
    Raven.captureBreadcrumb({message: "Footer button: " + value});
    if (f.isFunction(fn)) {
      fn(...args);
    }
    // ActionCreator.closeOverlay();
  };

  render() {
    const {actions} = this.props;
    if (f.isEmpty(actions)) {
      return null;
    } else {
      const [pos, neg, ntr] = f.props(["positive", "negative", "neutral"], actions);
      const makeButton = (className, [text, fn]) => (
        <a className={"button " + className}
          onClick={this.wrapButtonFn(className, fn)}
        >
          {text}
        </a>
      );
      const buttonsItem = (
        <div className="action-buttons">
          {(neg) ? makeButton("negative", neg) : null}
          {(ntr) ? makeButton("neutral", ntr) : null}
          {(pos) ? makeButton("positive", pos) : null}
        </div>
      );
      return <footer className="button-wrapper">{buttonsItem}</footer>;
    }
  }
}

export default Footer;
