import React, {PureComponent, PropTypes} from "react";
import classNames from "classnames";
import ActionCreator from "../../actions/ActionCreator";
import * as f from "lodash/fp";
import SvgIcon from "../helperComponents/SvgIcon";
import Dispatcher from "../../dispatcher/Dispatcher";
import {ActionTypes} from "../../constants/TableauxConstants";

class Header extends PureComponent {
  static propTypes = {
    title: PropTypes.oneOfType([PropTypes.string, PropTypes.element]).isRequired,  // main headline
    context: PropTypes.string,           // additional context info
    actions: PropTypes.object,           // map: {[positive|negative|neutral]: [text, function]} for buttons
    components: PropTypes.element,       // more components to display, e.g. search bar
    id: PropTypes.number
  };

  constructor(props) {
    super(props);
    this.state = {
      title: props.title,
      context: props.context
    };
  }

  componentDidMount() {
    if (f.isNumber(this.props.id)) {
      Dispatcher.on(ActionTypes.CHANGE_HEADER_TITLE, this.changeTitle);
    }
  }

  componentWillUnmount() {
    Dispatcher.off(ActionTypes.CHANGE_HEADER_TITLE, this.changeTitle);
  }

  changeTitle = ({id, title, context}) => {
    if (id !== this.props.id) {
      return;
    }
    const newTitle = title || this.state.title;
    const newContext = context || this.state.context;
    this.setState({title: newTitle, context: newContext});
  };

  componentWillReceiveProps(next) {
    if (next.title !== this.props.title) {
      this.setState({title: next.title});
    }
  }

  componentWillUpdate(next, nextState) {
    const stateKeys = f.uniq([...f.keys(nextState), ...f.keys(this.state)]).filter((key) => nextState[key] !== this.state[key])
    const propKeys = f.uniq([...f.keys(next), ...f.keys(this.props)]).filter((key) => next[key] !== this.props[key])
    devLog(propKeys, stateKeys)
  }

  render() {
    const {actions, components} = this.props;
    const {title, context} = this.state;
    const cssClass = classNames(
      "header-wrapper",
      {
        "with-buttons": actions,
        "with-components": components || this.props.children
      }
    );
    const [pos, neg, ntr] = f.props(["positive", "negative", "neutral"], actions);
    const makeButton = (className, [text, fn, dontClose]) => {
      if (!f.isFunction(fn)) {
        console.error("Action for button", text, "is not a function");
        return;
      }
      return (
        <a className={"button " + className}
           onClick={(dontClose) ? (fn || f.noop) : f.compose(ActionCreator.closeOverlay, fn || f.noop)}
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

    const children = f.compose(
      f.compact,
      f.defaultTo([components]),
      f.get(["props", "children"])
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
