import React from "react";
import i18n from "i18next";

import PropTypes from "prop-types";

const TooltipBubble = ({ messages }) => {
  const [prefix, text] = messages;

  return (
    <div className="message-bubble">
      <div className={text ? "message-bubble__prefix" : "message-bubble__text"}>
        {i18n.t(prefix)}
      </div>
      {text && <div className="message-bubble__text">{i18n.t(text)}</div>}
    </div>
  );
};

export default TooltipBubble;

TooltipBubble.propTypes = {
  messages: PropTypes.arrayOf(PropTypes.string).isRequired
};
