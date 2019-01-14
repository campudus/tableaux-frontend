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
  const { content } = props;
  return <div className="toast-wrapper">{content}</div>;
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
      hidingTimer: setTimer();
    },
    {
      resetTimer: (state, props) => () => {
        const { hidingTimer } = state;
        const { setTimer } = props;
        hidingTimer && clearInterval(hidingTimer);
        return {
          hidingTimer: setTimer()
        };
      }
    }
  ),
  onlyUpdateForKeys(["content"]),
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
