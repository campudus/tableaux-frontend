import React from "react";
import {translate} from "react-i18next";
import PropTypes from "prop-types";

const Toast = (props) => {
  const {content} = props;
  return (
    <div className="toast-wrapper">
      {content}
    </div>
  );
};

Toast.propTypes = {
  content: PropTypes.any.isRequired
};

export default translate(["table"])(Toast);
