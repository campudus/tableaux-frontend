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

import PropTypes from "prop-types";

import { stopPropagation } from "../../helpers/functools";
import StyleControls from "./StyleControls";

const markdownToState = f.compose(convertFromRaw, markdownToDraft);

const stateToMarkdown = f.compose(draftToMarkdown, convertToRaw);

const Link = props => {
  const { url } = props.contentState.getEntity(props.entityKey).getData();
  return (
    <a className="markdown-editor__link" href={url}>
      {props.children}
    </a>
  );
};

class EditorPanel extends React.PureComponent {
  constructor(props) {
    super(props);
    const { initialMarkdown } = props;

    const findLinkEntities = (contentBlock, callback, contentState) => {
      contentBlock.findEntityRanges(character => {
        const entityKey = character.getEntity();
        return (
          !f.isNil(entityKey) &&
          contentState.getEntity(entityKey).getType() === "LINK"
        );
      }, callback);
    };

    const decorator = new CompositeDecorator([
      { strategy: findLinkEntities, component: Link }
    ]);

    this.state = {
      editorState: EditorState.createWithContent(
        markdownToState(initialMarkdown),
        decorator
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

  focus = () => this.editorRefElement && this.editorRefElement.focus();
  editorRef = element => (this.editorRefElement = element);

  setEditorState = (editorState, callback) => {
    this.setState({ editorState }, state => {
      callback && callback(state);
    });
  };

  focusEditor = () => {
    this.editorRefElement.focus();
  };

  render() {
    const { hideToolbar, readOnly, controlButtons } = this.props;
    const { editorState } = this.state;
    const {
      toggleBlockType,
      toggleInlineStyle,
      setEditorState,
      editorRef,
      handleChange,
      handleKeyCommand
    } = this;

    return (
      <div
        className="markdown-editor-wrapper"
        onMouseDown={stopPropagation}
        onClick={stopPropagation}
      >
        {!hideToolbar && (
          <StyleControls
            toggleBlockType={toggleBlockType}
            toggleInlineStyle={toggleInlineStyle}
            editorState={editorState}
            setEditorState={setEditorState}
            additionalButtons={controlButtons}
          />
        )}

        <div className="draft-editor-wrapper" onClick={this.focusEditor}>
          <Editor
            readOnly={readOnly}
            ref={editorRef}
            editorState={editorState}
            onChange={handleChange}
            handleKeyCommand={handleKeyCommand}
            placeholder={i18n.t("table:empty.text")}
          />
        </div>
      </div>
    );
  }
}

export default EditorPanel;

EditorPanel.propTypes = {
  initialMarkdown: PropTypes.string,
  onChange: PropTypes.func,
  hideToolbar: PropTypes.bool,
  readOnly: PropTypes.bool,
  controlButtons: PropTypes.element
};
