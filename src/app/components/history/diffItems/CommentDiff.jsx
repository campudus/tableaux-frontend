import React from "react";
import i18n from "i18next";

const CommentDiff = props => {
  const {
    revision: { value, event }
  } = props;

  return (
    <div className={"diff-comment-item" + " " + event}>
      <i className="fa fa-commenting diff-comment-item__icon" />
      <div className={"diff-comment-item__comment-value" + " " + event}>
        {i18n.t(`history:${value}`)}
      </div>
    </div>
  );
};

export default CommentDiff;
