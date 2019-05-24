import React from "react";
import PropTypes from "prop-types";

import EditorPanel from "./EditorPanel";

const MarkdownEditor = ({ value, cell, actions, langtag }) => {
  const isMultiLanguage = cell.column.multilanguage;
  const theMarkdown = React.useRef(
    (isMultiLanguage ? value[langtag] : value) || ""
  );

  const handleChange = React.useCallback(markdown => {
    console.log("Markdown changed:", markdown);
    theMarkdown.current = markdown;
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
    return onUnmount;
  }, []);

  return (
    <div className="markdown-editor">
      <EditorPanel
        initialMarkdown={theMarkdown.current}
        onChange={handleChange}
      />
    </div>
  );
};

export default MarkdownEditor;

MarkdownEditor.propTypes = {
  value: PropTypes.oneOf([PropTypes.object, PropTypes.string]),
  cell: PropTypes.object.isRequired,
  actions: PropTypes.object.isRequired,
  langtag: PropTypes.string.isRequired
};
