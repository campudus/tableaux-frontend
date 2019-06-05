import CodeMirror from "react-codemirror";
import "codemirror/mode/markdown/markdown"; // must be after "import CodeMirror"
import React from "react";
import ReactMarkdown from "react-markdown";

import PropTypes from "prop-types";
import classNames from "classnames";

const PlainMarkdownEditor = (
  { controlButtons, initialMarkdown, className, onChange, readOnly },
  ref
) => {
  const [markdown, setMarkdown] = React.useState(initialMarkdown || "");
  const editorRef = React.useRef();

  const cssClass = classNames("plain-markdown-editor", className);

  const editorOptions = {
    lineNumbers: false,
    mode: "markdown",
    lineWrapping: true,
    readOnly
  };

  React.useImperativeHandle(ref, () => ({
    focus: () => editorRef.current && editorRef.current.focus()
  }));

  const handleChange = newValue => {
    setMarkdown(newValue);
    onChange(newValue);
  };

  return (
    <>
      {" "}
      <div className="richtext-toggle-style__bar">{controlButtons}</div>
      <div className={cssClass}>
        <CodeMirror
          ref={editorRef}
          value={markdown}
          onChange={handleChange}
          options={editorOptions}
          autoFocus={true}
        />
        <div className="plain-markdown-editor__preview">
          <ReactMarkdown source={markdown} />
        </div>
      </div>
    </>
  );
};

export default React.forwardRef(PlainMarkdownEditor);

PlainMarkdownEditor.propTypes = {
  initialMarkdown: PropTypes.string,
  className: PropTypes.string,
  readOnly: PropTypes.bool,
  onChange: PropTypes.func.isRequired,
  controlButtons: PropTypes.array
};
