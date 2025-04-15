import React from "react";
import { translate } from "react-i18next";
import PropTypes from "prop-types";
import f from "lodash/fp";
import { compose, withHandlers, withStateHandlers, lifecycle } from "recompose";

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
      return {
        hidingTimer: setTimer()
      };
    },
    {
      clearTimer: state => () => {
        state && state.hidingTimer && clearTimeout(state.hidingTimer);
        return {
          hidingTimer: null
        };
      },
      resetTimer: (state, props) => () => {
        const { setTimer } = props;
        state && state.hidingTimer && clearTimeout(state.hidingTimer);
        return {
          hidingTimer: setTimer()
        };
      }
    }
  ),
  lifecycle({
    componentWillUpdate() {
      this.props.resetTimer();
    },
    componentWillUnmount() {
      const { hidingTimer } = this.props;
      hidingTimer && clearTimeout(hidingTimer);
    },
    shouldComponentUpdate(nextProps) {
      // we only update if the content changed
      // so the timer does not reset itself
      return !f.isEqual(this.props.content, nextProps.content);
    }
  })
);

export default compose(selfHiding, translate(["table"]))(Toast);
