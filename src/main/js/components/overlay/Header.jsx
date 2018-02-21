import React, {PureComponent} from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import ActionCreator from "../../actions/ActionCreator";
import f from "lodash/fp";
import SvgIcon from "../helperComponents/SvgIcon";
import Raven from "raven-js";

class Header extends PureComponent {
  static propTypes = {
    title: PropTypes.oneOfType([PropTypes.string, PropTypes.element]).isRequired, // main headline
    context: PropTypes.string, // additional context info
    actions: PropTypes.object, // map: {[positive|negative|neutral]: [text, function]} for buttons
    components: PropTypes.element, // more components to display, e.g. search bar
    id: PropTypes.number
  };

  constructor(props) {
    super(props);
    this.state = {
      title: props.title
    };
  }

  componentWillReceiveProps(next) {
    if (next.title !== this.props.title) {
      this.setState({title: next.title});
    }
  }

  wrapButtonFn = (value, fn) => (...args) => {
    Raven.captureBreadcrumb({message: "Header button: " + value});
    if (f.isFunction(fn)) {
      fn(...args);
    }
    ActionCreator.closeOverlay();
  };

  render() {
    const {actions, components, context} = this.props;
    const {title} = this.state;
    const cssClass = classNames(
      "header-wrapper",
      {
        "with-buttons": actions,
        "with-components": components || this.props.children
      }
    );
    const [pos, neg, ntr] = f.props(["positive", "negative", "neutral"], actions);
    const makeButton = (className, [text, fn, dontClose]) => {
      const execAndClose = this.wrapButtonFn(className, fn);
      return (
        <a className={"button " + className}
          onClick={(dontClose) ? (fn || f.noop) : execAndClose}
        >
          {text}
        </a>
      );
    };
    const buttonsItem = (f.isEmpty(actions))
      ? null
      : (
        <div className="action-buttons">
          {(neg) ? makeButton("negative", neg) : null}
          {(ntr) ? makeButton("neutral", ntr) : null}
          {(pos) ? makeButton("positive", pos) : null}
        </div>
      );

    const children = f.flow(
      f.get(["props", "children"]),
      f.defaultTo([components]),
      f.compact
    )(components);

    return (
      <div className={cssClass}>
        <div className="close-button">
          <a href="#" onClick={() => { ActionCreator.closeOverlay(); }}>
            <SvgIcon icon="cross" containerClasses="color-white" center={true} />
          </a>
        </div>
        <div className="labels">
          <div className="context-info">{context || "Action"}</div>
          <div className="title">{title}</div>
        </div>
        {buttonsItem}
        {children
          .map((el, idx) => React.cloneElement(el, {id: this.props.id, key: idx}))}
        {this.props.children}
      </div>
    );
  }
}

export default Header;
