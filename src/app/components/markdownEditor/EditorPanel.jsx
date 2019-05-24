import React from "react";
import PropTypes from "prop-types";
import {
  Editor,
  EditorState,
  convertFromRaw,
  convertToRaw,
  RichUtils
} from "draft-js";
import { markdownToDraft, draftToMarkdown } from "markdown-draft-js";
import f from "lodash/fp";

const markdownToState = f.compose(
  convertFromRaw,
  markdownToDraft
);

const stateToMarkdown = f.compose(
  draftToMarkdown,
  convertToRaw
);

const EditorPanel = ({ initialMarkdown, onChange }) => {
  const [editorState, setEditorState] = React.useState(
    EditorState.createWithContent(markdownToState(initialMarkdown))
  );

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

  console.log({ initialMarkdown, editorState });

  return (
    <Editor
      editorState={editorState}
      onChange={handleChange}
      handleKeyCommand={handleKeyCommand}
    />
  );
};

export default EditorPanel;

EditorPanel.propTypes = {
  initialMarkdown: PropTypes.string,
  onChange: PropTypes.func
};
