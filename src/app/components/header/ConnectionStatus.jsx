import React from "react";
import PropTypes from "prop-types";

export const ConnectionStatus = props => {
  const { isConnected } = props;
  const cssClass =
    "connection-status " +
    (isConnected
      ? "connection-status--connected"
      : "connection-status--disconnected");

  return (
    <div className={cssClass}>
      <i className="connection-status__icon fa fa-wifi" />
    </div>
  );
};

ConnectionStatus.propTypes = {
  isConnected: PropTypes.bool.isRequired
};
