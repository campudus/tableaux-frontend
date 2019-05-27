import React from "react";
import PropTypes from "prop-types";

import EditorPanel from "./EditorPanel";

const MarkdownEditor = ({ value, cell, actions, langtag }, ref) => {
  const isMultiLanguage = cell.column.multilanguage;
  const theMarkdown = React.useRef(
    (isMultiLanguage ? value[langtag] : value) || ""
  );

  const editorRef = React.useRef();
  React.useImperativeHandle(ref, () => ({
    focus: editorRef.current && editorRef.current.focus()
  }));

  const handleChange = React.useCallback(markdown => {
    theMarkdown.current = markdown;
  });

  const focusInput = React.useCallback(() => {
    editorRef.current && editorRef.current.focus && editorRef.current.focus();
  });

  React.useEffect(() => {
    const onUnmount = () => {
      actions.changeCellValue({
        oldValue: value,
        newValue: isMultiLanguage
          ? { [langtag]: theMarkdown.current }
          : theMarkdown.current,
        cell
      });
    };
    focusInput();
    return onUnmount;
  }, []);

  return (
    <div className="markdown-editor" onClick={focusInput}>
      <EditorPanel
        ref={editorRef}
        initialMarkdown={theMarkdown.current}
        onChange={handleChange}
      />
    </div>
  );
};

export default React.forwardRef(MarkdownEditor);

MarkdownEditor.propTypes = {
  value: PropTypes.oneOf([PropTypes.object, PropTypes.string]),
  cell: PropTypes.object.isRequired,
  actions: PropTypes.object.isRequired,
  langtag: PropTypes.string.isRequired
};
