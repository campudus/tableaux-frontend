import { EditorState, RichUtils } from "draft-js";
import React, { useEffect, useRef } from "react";
import i18n from "i18next";

import PropTypes from "prop-types";

import { StyleIcon } from "./StyleControls";
import { either } from "../../helpers/functools";
import { outsideClickEffect } from "../../helpers/useOutsideClick";

const UrlInput = ({ setLinkUrl, editorState, onClose }) => {
  const container = useRef();
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
  const handleKeyDown = React.useCallback(
    event => event.key === "Enter" && setLinkUrl(url),
    [url]
  );

  useEffect(
    outsideClickEffect({
      shouldListen: true,
      containerRef: container,
      onOutsideClick: onClose
    }),
    [container.current]
  );

  return (
    <div className="link-editor-popup" ref={container}>
      <header className="link-editor__header">
        <i className="link-editor__header-icon fa fa-link" />
        {i18n.t("table:link-editor.headline")}
      </header>
      <section className="link-editor__body">
        <div className="link-editor-body__placeholder col-one row-one" />
        <div className="link-editor-body__heading col-two row-one">
          {i18n.t("table:link-editor.enter-link")}
        </div>
        <div className="link-editor-body__label col-one row-two">
          <div className="link-editor-label__text">{i18n.t("common:url")}</div>
        </div>
        <input
          placeholder="https://"
          className="link-editor__input right col-two row-two"
          type="text"
          value={url}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
        />
        <div className="link-editor-body__label col-one row-three">
          <div className="link-editor-label__text">
            {i18n.t("table:link-editor.linked-text")}
          </div>
        </div>
        <input
          placeholder={i18n.t("common:url")}
          className="link-editor__input col-two row-three"
          type="text"
          value={linkTitle}
          disabled={true}
        />
      </section>
      <footer className="link-editor__footer">
        <button
          className="link-editor__cancel-button button neutral"
          onClick={onClose}
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
};

UrlInput.propTypes = {
  editorState: PropTypes.object.isRequired,
  setLinkUrl: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired
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
          onClose={handleCloseUrlInput}
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
