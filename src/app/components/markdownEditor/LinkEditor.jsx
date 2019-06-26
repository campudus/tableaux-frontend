import { EditorState, RichUtils } from "draft-js";
import React from "react";
import i18n from "i18next";
import listensToClickOutsice from "react-onclickoutside";

import PropTypes from "prop-types";

import { StyleIcon } from "./StyleControls";
import { either } from "../../helpers/functools";

const UrlInput = listensToClickOutsice(
  ({ setLinkUrl, editorState, handleClickOutside }) => {
    const getUrlAtPoint = selection => {
      if (!selection.isCollapsed()) {
        // Adapted from DraftJS link example
        // https://github.com/facebook/draft-js/blob/ceaeebf1f50fee452d92d71c5e2008e3d4fb6d9f/examples/draft-0-10-0/link/link.html#L76
        const content = editorState.getCurrentContent();
        const startKey = selection().getStartKey();
        const startOffset = selection.getStartOffset();
        const blockWithLinkAtBeginning = content.getBlockForKey(startKey);
        const linkKey = blockWithLinkAtBeginning.getEntityAt(startOffset);

        const url = linkKey ? content.getEntity(linkKey).getData().url : "";
        return url;
      } else {
        return "";
      }
    };

    const [url, setUrl] = React.useState(
      either(editorState.getSelection())
        .map(getUrlAtPoint)
        .getOrElse("")
    );
    const handleChange = React.useCallback(event => setUrl(event.target.value));
    const closeInput = handleClickOutside;
    const setLinkUrlAndClose = React.useCallback(() => {
      setLinkUrl(url);
      closeInput();
    });

    return (
      <div className="link-editor__input">
        <button
          className="link-editor__cancel-button button"
          onClick={closeInput}
        >
          {i18n.t("common:cancel")}
        </button>
        <input
          placeholder={i18n.t("common:url")}
          className="link-editor__input"
          type="text"
          value={url}
          onChange={handleChange}
        />
        <button
          className="link-editor__confirm-button button positive"
          onClick={setLinkUrlAndClose}
        >
          {i18n.t("common:ok")}
        </button>
      </div>
    );
  }
);
UrlInput.propTypes = {
  editorState: PropTypes.object.isRequired,
  setLinkUrl: PropTypes.func.isRequired,
  handleClickOutside: PropTypes.func.isRequired
};

const LinkEditor = ({ editorState, setEditorState }) => {
  const [showUrlInput, setShowUrlInput] = React.useState(false);
  const toggleUrlInput = React.useCallback(() =>
    setShowUrlInput(!showUrlInput)
  );
  const closeUrlInput = React.useCallback(() => setShowUrlInput(false));

  const removeLink = React.useCallback(() => {
    const selection = editorState.getSelection();
    if (!selection.isCollapsed()) {
      setEditorState(RichUtils.toggleLink(editorState, selection, null));
    }
  });

  const setLinkUrl = React.useCallback(url => {
    const content = editorState.getCurrentContent();
    const contentWithNewLink = content.createEntity("LINK", "MUTABLE", { url });
    const entityKey = contentWithNewLink.getLastCreatedEntityKey();
    const newEditorState = EditorState.set(editorState, {
      currentContent: contentWithNewLink
    });
    setEditorState(
      RichUtils.toggleLink(
        newEditorState,
        newEditorState.getSelection(),
        entityKey
      )
    );
  });

  return (
    <div className="link-editor">
      <StyleIcon
        toggleStyle={toggleUrlInput}
        className={showUrlInput ? "ignore-react-onclickoutside" : undefined}
        styleToToggle=""
        icon="fa-link"
      />
      <StyleIcon toggleStyle={removeLink} styleToToggle="" icon="fa-unlink" />
      {showUrlInput && (
        <UrlInput
          editorState={editorState}
          setLinkUrl={setLinkUrl}
          handleClickOutside={closeUrlInput}
        />
      )}
    </div>
  );
};

export default LinkEditor;

LinkEditor.propTypes = {
  setEditorState: PropTypes.func.isRequired,
  editorState: PropTypes.object.isRequired
};
