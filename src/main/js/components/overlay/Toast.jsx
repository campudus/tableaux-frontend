import React from "react";
import {translate} from "react-i18next";

let Toast = (props) => {
  const {content} = props;
  return (
    <div className="toast-wrapper">
      {content}
    </div>
  );
};

Toast.propTypes = {
  content: React.PropTypes.any.isRequired
};

export default translate(["table"])(Toast);
