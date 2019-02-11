import React, { useState } from "react";
import PropTypes from "prop-types";
import AnnotationPopup from "./AnnotationPopup";
import f from "lodash/fp";
import { maybe } from "../../helpers/functools";

const TextAnnotationButton = props => {
  const [node, rememberNode] = useState(null);
  const { cell, open, togglePopup } = props;

  const handleClick = event => {
    event.stopPropagation();
    rememberNode(event.target);
    if (!open) {
      togglePopup(cell);
    } else {
      togglePopup();
    }
  };
  const annotations = f.flow(
    f.props(["info", "warning", "error"]),
    f.compact,
    f.flatten
  )(cell.annotations);

  const cbr = maybe(node)
    .exec("getBoundingClientRect")
    .getOrElse({});
  return (
    <div
      className={`text-annotation-button ${
        open ? "ignore-react-onclickoutside" : ""
      }`}
      onClick={handleClick}
      ref={rememberNode}
    >
      <i className="fa fa-commenting" />
      {open ? (
        <AnnotationPopup
          nAnnotations={f.size(annotations)}
          x={cbr.left}
          y={cbr.top}
          {...props}
        />
      ) : null}
    </div>
  );
};

export default TextAnnotationButton;

TextAnnotationButton.propTypes = {
  cell: PropTypes.object.isRequired,
  open: PropTypes.bool,
  togglePopup: PropTypes.func.isRequired,
  langtag: PropTypes.string.isRequired
};
