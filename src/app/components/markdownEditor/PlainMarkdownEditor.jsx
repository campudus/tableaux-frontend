import "codemirror/mode/markdown/markdown";

import CodeMirror from "react-codemirror";
import React from "react";
import ReactMarkdown from "react-markdown";

import PropTypes from "prop-types";
import classNames from "classnames";

import { StyleIcon } from "./StyleControls";
import { useLocalStorage } from "../../helpers/useLocalStorage";
import SvgIcon from "../helperComponents/SvgIcon";

const PreviewModes = {
  HORIZONTAL: "HORIZONTAL",
  VERTICAL: "VERTICAL",
  NONE: "NONE"
};

const PlainMarkdownEditor = (
  { controlButtons, initialMarkdown, className, onChange, readOnly },
  ref
) => {
  const [markdown, setMarkdown] = React.useState(initialMarkdown || "");
  const editorRef = React.useRef();

  const [markdownPreview, setMarkdownPreview] = useLocalStorage(
    "markdownPreview",
    PreviewModes.HORIZONTAL
  );

  const cssClass = classNames("plain-markdown-editor", className, {
    "markdown-editor--split-h": markdownPreview === PreviewModes.HORIZONTAL,
    "markdown-editor--split-v": markdownPreview === PreviewModes.VERTICAL,
    "markdown-editor--hide-preview": markdownPreview === PreviewModes.NONE
  });

  const editorOptions = {
    lineNumbers: false,
    mode: "markdown",
    lineWrapping: true,
    readOnly
  };

  React.useImperativeHandle(ref, () => ({
    focus: () => editorRef.current && editorRef.current.focus()
  }));

  const handleChange = React.useCallback(newValue => {
    setMarkdown(newValue);
    onChange(newValue);
  });

  const previewSelectorControls = [
    {
      key: PreviewModes.NONE,
      toggleStyle: setMarkdownPreview,
      styleToToggle: PreviewModes.NONE,
      active: markdownPreview === PreviewModes.NONE,
      iconComponent: <SvgIcon icon="layoutPlain" />
    },
    {
      key: PreviewModes.VERTICAL,
      toggleStyle: setMarkdownPreview,
      styleToToggle: PreviewModes.VERTICAL,
      active: markdownPreview === PreviewModes.VERTICAL,
      iconComponent: <SvgIcon icon="layoutV" />
    },
    {
      key: PreviewModes.HORIZONTAL,
      toggleStyle: setMarkdownPreview,
      styleToToggle: PreviewModes.HORIZONTAL,
      active: markdownPreview === PreviewModes.HORIZONTAL,
      iconComponent: <SvgIcon icon="layoutH" />
    }
  ];

  console.log({ markdownPreview, cssClass });

  return (
    <>
      <header className="richtext-toggle-style__bar">
        {previewSelectorControls.map(buttonProps => (
          <StyleIcon key={buttonProps.key} {...buttonProps} />
        ))}
        <div className="richtext-toggle-style__placeholder" />
        {controlButtons}
      </header>
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
