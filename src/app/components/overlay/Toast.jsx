import React from "react";
import { translate } from "react-i18next";
import PropTypes from "prop-types";
import {
  compose,
  withHandlers,
  withStateHandlers,
  lifecycle,
  onlyUpdateForKeys
} from "recompose";

const Toast = props => {
  const { content, clearTimer, setTimer } = props;
  return (
    <div
      className="toast-wrapper"
      onMouseOver={clearTimer}
      onMouseOut={setTimer}
    >
      {content}
    </div>
  );
};

Toast.propTypes = {
  content: PropTypes.any.isRequired
};

const selfHiding = compose(
  withHandlers({
    setTimer: ({ actions, duration }) => () =>
      setTimeout(actions.hideToast, duration)
  }),
  withStateHandlers(
    ({ setTimer }) => {
      setTimer();
    },
    {
      clearTimer: state =>
        state && state.hidingTimer && clearInterval(hidingTimer),
      resetTimer: (state, props) => () => {
        const { setTimer = () => null } = props;
        state && state.hidingTimer && clearInterval(state.hidingTimer);
        return {
          hidingTimer: setTimer()
        };
      }
    }
  ),
  onlyUpdateForKeys(["content"]), // else resetting timer will cause recursive redraws
  lifecycle({
    componentWillUpdate() {
      this.props.resetTimer();
    },
    componentWillUnmount() {
      const { hidingTimer } = this.props;
      hidingTimer && clearInterval(hidingTimer);
    }
  })
);

export default compose(
  selfHiding,
  translate(["table"])
)(Toast);
