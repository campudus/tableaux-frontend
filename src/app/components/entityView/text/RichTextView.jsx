import React from "react";

import PropTypes from "prop-types";

import { either } from "../../../helpers/functools";
import MarkdownEditor from "../../markdownEditor/MarkdownEditor";

const RichTextView = ({
  funcs,

  actions,
  cell,
  cell: { value },
  langtag,
  thisUserCantEdit
}) => {
  const baseRef = React.useRef();
  const editorRef = React.useRef();

  React.useEffect(() => {
    editorRef.current &&
      editorRef.current.focus &&
      funcs &&
      funcs.register &&
      funcs.register(editorRef.current);
  }, []);

  const isFocused = either(baseRef.current)
    .exec("contains", document.activeElement)
    .getOrElse(false);

  return (
    <div className="item-content view-richtext" tabIndex="1" ref={baseRef}>
      <MarkdownEditor
        readOnly={!!thisUserCantEdit || !isFocused}
        value={value}
        cell={cell}
        actions={actions}
        langtag={langtag}
      />
    </div>
  );
};

export default RichTextView;

RichTextView.propTypes = {
  langtag: PropTypes.string.isRequired,
  cell: PropTypes.object.isRequired,
  thisUserCantEdit: PropTypes.bool,
  actions: PropTypes.object.isRequired,
  funcs: PropTypes.object.isRequired
};
