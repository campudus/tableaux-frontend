import {
  Editor,
  EditorState,
  convertFromRaw,
  convertToRaw,
  RichUtils
} from "draft-js";
import { markdownToDraft, draftToMarkdown } from "markdown-draft-js";
import React from "react";
import f from "lodash/fp";
import i18n from "i18next";

import PropTypes from "prop-types";

import StyleControls from "./StyleControls";

const markdownToState = f.compose(
  convertFromRaw,
  markdownToDraft
);

const stateToMarkdown = f.compose(
  draftToMarkdown,
  convertToRaw
);

const EditorPanel = (
  { initialMarkdown, onChange, hideToolbar, readOnly },
  ref
) => {
  const [editorState, setEditorState] = React.useState(
    EditorState.createWithContent(markdownToState(initialMarkdown))
  );
  const editorRef = React.useRef();
  React.useImperativeHandle(ref, () => ({
    focus: editorRef.current && editorRef.current.focus()
  }));

  const handleChange = React.useCallback(newState => {
    setEditorState(newState);
    onChange(stateToMarkdown(newState.getCurrentContent()));
  });

  const handleKeyCommand = React.useCallback((command, transientState) => {
    const newState = RichUtils.handleKeyCommand(transientState, command);
    if (newState) {
      setEditorState(newState);
      return "handled";
    }
    return "not-handled";
  });

  const toggleBlockType = React.useCallback(typeToToggle => {
    const stateWithToggledBlock = RichUtils.toggleBlockType(
      editorState,
      typeToToggle
    );
    handleChange(stateWithToggledBlock);
  });

  const toggleInlineStyle = React.useCallback(styleToToggle => {
    const stateWithToggledStyle = RichUtils.toggleInlineStyle(
      editorState,
      styleToToggle
    );
    handleChange(stateWithToggledStyle);
  });

  console.log({ initialMarkdown, editorState });

  return (
    <>
      {!hideToolbar && (
        <StyleControls
          toggleBlockType={toggleBlockType}
          toggleInlineStyle={toggleInlineStyle}
          editorState={editorState}
        />
      )}
      <Editor
        readOnly={readOnly}
        ref={editorRef}
        editorState={editorState}
        onChange={handleChange}
        handleKeyCommand={handleKeyCommand}
        placeholder={i18n.t("table:empty.text")}
      />
    </>
  );
};

export default React.forwardRef(EditorPanel);

EditorPanel.propTypes = {
  initialMarkdown: PropTypes.string,
  onChange: PropTypes.func,
  hideToolbar: PropTypes.bool,
  readOnly: PropTypes.bool
};
