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
        const startKey = selection.getStartKey();
        const startOffset = selection.getStartOffset();
        const blockWithLinkAtBeginning = content.getBlockForKey(startKey);
        const linkKey = blockWithLinkAtBeginning.getEntityAt(startOffset);

        const url = linkKey ? content.getEntity(linkKey).getData().url : "";
        return url;
      } else {
        return "";
      }
    };

    const extractSelectedText = selection => {
      const content = editorState.getCurrentContent();
      const startKey = selection.getStartKey();
      const startOffset = selection.getStartOffset();
      const endOffset = selection.getEndOffset();
      const contentBlock = content.getBlockForKey(startKey);
      return either(contentBlock)
        .map(block => block.getText())
        .map(string => string.slice(startOffset, endOffset))
        .getOrElse("");
    };

    const [url, setUrl] = React.useState(
      either(editorState.getSelection())
        .map(getUrlAtPoint)
        .getOrElse("")
    );
    const linkTitle = extractSelectedText(editorState.getSelection());
    const handleChange = React.useCallback(event => setUrl(event.target.value));
    const closeInput = handleClickOutside;
    const handleKeyDown = React.useCallback(
      event => event.key === "Enter" && setLinkUrl(url),
      [url]
    );

    return (
      <div className="link-editor-popup">
        <header className="link-editor__header">
          <i className="link-editor__header-icon fa fa-link" />
          {i18n.t("table:link-editor.headline")}
        </header>
        <section className="link-editor__body">
          <div className="link-editor-body__placeholder" />
          <div className="link-editor-body__heading">
            {i18n.t("table:link-editor.enter-link")}
          </div>
          <div className="link-editor-body__label">
            <div className="link-editor-label__text">
              {i18n.t("common:url")}
            </div>
          </div>
          <input
            placeholder="https://"
            className="link-editor__input"
            type="text"
            value={url}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
          />
          <div className="link-editor-body__label">
            <div className="link-editor-label__text">
              {i18n.t("table:link-editor.linked-text")}
            </div>
          </div>
          <input
            placeholder={i18n.t("common:url")}
            className="link-editor__input"
            type="text"
            value={linkTitle}
            disabled={true}
          />
        </section>
        <footer className="link-editor__footer">
          <button
            className="link-editor__cancel-button button neutral"
            onClick={closeInput}
          >
            {i18n.t("common:cancel")}
          </button>

          <button
            className="link-editor__confirm-button button"
            onClick={() => setLinkUrl(url)}
          >
            {i18n.t("table:link-editor.insert-link")}
          </button>
        </footer>
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

  // (void) -> EditorState
  const toggleFakeSelectionStyle = () =>
    RichUtils.toggleInlineStyle(editorState, "UNDERLINE");

  // ((any) -> any) -> void
  // side-effects
  const toggleFakeSelectionAnd = handler => (...args) => {
    handler(...args);
    setEditorState(toggleFakeSelectionStyle());
  };

  const isTextSelected = React.useCallback(
    () => !editorState.getSelection().isCollapsed()
  );

  const openUrlInput = () => setShowUrlInput(true);

  const closeUrlInput = () => setShowUrlInput(false);

  const removeLink = React.useCallback(() => {
    const selection = editorState.getSelection();
    if (!selection.isCollapsed()) {
      setEditorState(RichUtils.toggleLink(editorState, selection, null));
    }
  });

  // Update editor state with link, close link input
  const setLinkUrl = React.useCallback(url => {
    // Disable fake selection before proceeding. DraftJS state is
    // immutable, so subsequent changes must be chained to avoid race
    // conditions
    const contentWithNewLink = toggleFakeSelectionStyle()
      .getCurrentContent()
      .createEntity("LINK", "MUTABLE", { url });

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
    closeUrlInput();
  });

  const handleOpenUrlInput = toggleFakeSelectionAnd(openUrlInput);
  const handleCloseUrlInput = toggleFakeSelectionAnd(closeUrlInput);

  return (
    <>
      <StyleIcon
        toggleStyle={showUrlInput ? handleCloseUrlInput : handleOpenUrlInput}
        className={showUrlInput ? "ignore-react-onclickoutside" : undefined}
        styleToToggle=""
        icon="fa-link"
        disabled={!isTextSelected()}
      />

      <StyleIcon
        toggleStyle={removeLink}
        styleToToggle=""
        icon="fa-unlink"
        disabled={!isTextSelected()}
      />

      {showUrlInput && (
        <UrlInput
          editorState={editorState}
          setLinkUrl={setLinkUrl}
          handleClickOutside={handleCloseUrlInput}
        />
      )}
    </>
  );
};

export default LinkEditor;

LinkEditor.propTypes = {
  setEditorState: PropTypes.func.isRequired,
  editorState: PropTypes.object.isRequired
};
