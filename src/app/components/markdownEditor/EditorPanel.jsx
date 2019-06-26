import {
  CompositeDecorator,
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
import listensToClickOutside from "react-onclickoutside";

import PropTypes from "prop-types";

import {
  either,
  preventDefault,
  stopPropagation
} from "../../helpers/functools";
import StyleControls from "./StyleControls";

const markdownToState = f.compose(
  convertFromRaw,
  markdownToDraft
);

const stateToMarkdown = f.compose(
  draftToMarkdown,
  convertToRaw
);

const LinkEditor = ({ editorState, setEditorState, handleClickOutside }) => {
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

  const inputRef = React.useRef();

  const handleUrlChange = React.useCallback(event => {
    setUrl(event.target.value);
    // forceTheGoddamnFocus();
  });

  const removeLink = React.useCallback(event => {
    preventDefault(event);
    const selection = editorState.getSelection();
    if (!selection.isCollapsed()) {
      setEditorState(RichUtils.toggleLink(editorState, selection, null));
    }
  });

  const setLinkUrl = React.useCallback(event => {
    preventDefault(event);
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
    handleClickOutside();
  });

  return (
    <div
      className="link-editor"
      style={{ display: "flex", justifyContent: "space-between" }}
    >
      <button
        className="link-editor__cancel-button button"
        onClick={handleClickOutside}
      >
        {i18n.t("common:cancel")}
      </button>
      <input
        placeholder={i18n.t("common:url")}
        className="link-editor__input"
        type="text"
        value={url}
        onChange={handleUrlChange}
        ref={inputRef}
      />
      <button
        className="link-editor__confirm-button button positive"
        onClick={setLinkUrl}
      >
        {i18n.t("common:ok")}
      </button>
    </div>
  );
};

LinkEditor.propTypes = {
  handleClickOutside: PropTypes.func.isRequired,
  setEditorState: PropTypes.func.isRequired,
  editorState: PropTypes.object.isRequired
};

// {editLink ? (
//     <SelfClosingLinkEditor
//         handleClickOutside={closeLinkOverlay}
//         editorState={editorState}
//         setEditorState={setEditorState}
//     />
// ) : (
//     <button onClick={openLinkOverlay}>open link overlay</button>
// )}

class EditorPanel extends React.PureComponent {
  static Link = props => {
    const { url } = props.contentState.getEntity(props.entityKey).getData();
    return (
      <a className="markdown-editor__link" href={url}>
        {props.children}
      </a>
    );
  };

  static findLinkEntities = (contentBlock, callback, contentState) => {
    contentBlock.findEntityRanges(character => {
      const entityKey = character.getEntity();
      return (
        !f.isNil(entityKey) &&
        contentState.getEntity(entityKey).getType() === "LINK"
      );
    }, callback);
  };

  static decorator = new CompositeDecorator([
    { strategy: EditorPanel.findLinkEntities, component: EditorPanel.Link }
  ]);

  constructor(props) {
    super(props);
    const { initialMarkdown } = props;
    this.state = {
      editorState: EditorState.createWithContent(
        markdownToState(initialMarkdown, EditorPanel.decorator)
      )
    };
  }

  handleChange = (newState, callback) => {
    this.setEditorState(newState, callback);
    this.props.onChange(stateToMarkdown(newState.getCurrentContent()));
  };

  handleKeyCommand = (command, transientState) => {
    const newState = RichUtils.handleKeyCommand(transientState, command);
    if (newState) {
      this.setEditorState(newState);
      return "handled";
    }
    return "not-handled";
  };

  toggleStyle = toggleFunction => styleToToggle => {
    const newState = toggleFunction(this.state.editorState, styleToToggle);
    this.handleChange(newState, this.focus);
  };

  toggleBlockType = this.toggleStyle(RichUtils.toggleBlockType);
  toggleInlineStyle = this.toggleStyle(RichUtils.toggleInlineStyle);

  keepMouseFocus = event => {
    stopPropagation(event);
  };

  focus = () => this.editorRefElement && this.editorRefElement.focus();
  editorRef = element => (this.editorRefElement = element);
  linkEditorRef = element => (this.linkEditorRefElement = element);

  setEditorState = (editorState, callback) => {
    this.setState({ editorState }, state => {
      callback && callback(state);
    });
  };

  render() {
    const { hideToolbar, readOnly, controlButtons } = this.props;
    const { editorState } = this.state;
    const {
      keepMouseFocus,
      toggleBlockType,
      toggleInlineStyle,
      setEditorState,
      editorRef,
      handleChange,
      handleKeyCommand
    } = this;

    return (
      <>
        <div onMouseDown={stopPropagation} onClick={stopPropagation}>
          {!hideToolbar && (
            <StyleControls
              toggleBlockType={toggleBlockType}
              toggleInlineStyle={toggleInlineStyle}
              editorState={editorState}
              additionalButtons={controlButtons}
            />
          )}
        </div>

        <div
          ref={this.linkEditorRef}
          className="focus-keeper"
          onClick={keepMouseFocus}
          onMouseDown={keepMouseFocus}
          onMouseUp={keepMouseFocus}
        >
          <LinkEditor
            handleClickOutside={() => null}
            editorState={editorState}
            setEditorState={setEditorState}
          />
        </div>

        <div onMouseDown={stopPropagation} onClick={stopPropagation}>
          <Editor
            readOnly={readOnly}
            ref={editorRef}
            editorState={editorState}
            onChange={handleChange}
            handleKeyCommand={handleKeyCommand}
            placeholder={i18n.t("table:empty.text")}
          />
        </div>
      </>
    );
  }
}

export default EditorPanel;

EditorPanel.propTypes = {
  initialMarkdown: PropTypes.string,
  onChange: PropTypes.func,
  hideToolbar: PropTypes.bool,
  readOnly: PropTypes.bool,
  controlButtons: PropTypes.array
};
