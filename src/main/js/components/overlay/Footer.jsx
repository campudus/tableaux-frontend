import React, {Component, PropTypes} from "react";
import * as f from "lodash/fp";
import ActionCreator from "../../actions/ActionCreator";

class Footer extends Component {
  static PropTypes = {            // compare OverlayHeader
    actions: PropTypes.object
  };

  render() {
    const {actions} = this.props;
    if (f.isEmpty(actions)) {
      return null;
    } else {
      const [pos, neg, ntr] = f.props(["positive", "negative", "neutral"], actions);
      const makeButton = (className, [text, fn]) => (
        <a className={"button " + className}
           onClick={f.compose(ActionCreator.closeOverlay, fn || f.noop)}
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
