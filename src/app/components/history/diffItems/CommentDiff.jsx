import React from "react";
import i18n from "i18next";

const CommentDiff = props => {
  const {
    revision: { value, event }
  } = props;

  return (
    <div className="diff-comment-item">
      <div className="diff-event">
        {i18n.t(
          `history:comment_${event.endsWith("added") ? "added" : "deleted"}`
        )}
      </div>
      <div className="diff-comment-item__comment-value">
        {i18n.t(`history:${value}`)}
      </div>
    </div>
  );
};
export default CommentDiff;
