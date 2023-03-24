import classNames from "classnames";
import "codemirror/mode/markdown/markdown";
import PropTypes from "prop-types";
import React from "react";
import CodeMirror from "react-codemirror";
import ReactMarkdown from "react-markdown";
import { StyleIcon } from "./StyleControls";
import {
  columnHasMinLength,
  columnHasMaxLength,
  isTextTooShort,
  getTextLength
} from "../../helpers/limitTextLength";
import i18n from "i18next";

const PreviewModes = {
  HORIZONTAL: "HORIZONTAL",
  VERTICAL: "VERTICAL",
  NONE: "NONE"
};

const PlainMarkdownEditor = (
  {
    controlButtons,
    initialMarkdown,
    className,
    onChange,
    readOnly,
    cell: { column }
  },
  ref
) => {
  const [markdown, setMarkdown] = React.useState(initialMarkdown || "");
  const [clickedOutside, setClickedOutside] = React.useState(false);
  const editorRef = React.useRef();

  const { minLength, maxLength } = column;
  const minLengthText = columnHasMinLength(column)
    ? i18n.t("table:text-length:min-length-full", { minLength })
    : "";
  const maxLengthText = columnHasMaxLength(column)
    ? `${getTextLength(markdown)}/${maxLength}`
    : "";
  // FIXME: Other preview modes' display components problematic with current
  // CodeMirror versions
  const markdownPreview = PreviewModes.HORIZONTAL;
  // const [markdownPreview, setMarkdownPreview] = useLocalStorage(
  //   "markdownPreview",
  //   PreviewModes.HORIZONTAL
  // );

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

  const handleChange = newValue => {
    setClickedOutside(false);
    if (
      columnHasMaxLength(column) &&
      getTextLength(newValue) > column.maxLength
    ) {
      //We have to manually set the value of the internal codemirror instance
      //as this is not a true controlled component. Not doing this WILL lead
      //to different states.
      const codeMirrorDoc = editorRef.current.getCodeMirror().getDoc();
      const currentCursor = codeMirrorDoc.getCursor();
      const newCursor = { ...currentCursor, ch: currentCursor.ch - 1 };
      codeMirrorDoc.setValue(markdown);
      //set cursor to previous location
      codeMirrorDoc.setCursor(newCursor);

      return;
    }
    setMarkdown(newValue);
    if (isTextTooShort(newValue)) {
      onChange(initialMarkdown);
    } else {
      onChange(newValue);
    }
  };

  const previewSelectorControls = [
    // FIXME: see above
    // {
    //   key: PreviewModes.NONE,
    //   toggleStyle: setMarkdownPreview,
    //   styleToToggle: PreviewModes.NONE,
    //   active: markdownPreview === PreviewModes.NONE,
    //   iconComponent: <SvgIcon icon="layoutPlain" />
    // },
    // {
    //   key: PreviewModes.VERTICAL,
    //   toggleStyle: setMarkdownPreview,
    //   styleToToggle: PreviewModes.VERTICAL,
    //   active: markdownPreview === PreviewModes.VERTICAL,
    //   iconComponent: <SvgIcon icon="layoutV" />
    // },
    // {
    //   key: PreviewModes.HORIZONTAL,
    //   toggleStyle: setMarkdownPreview,
    //   styleToToggle: PreviewModes.HORIZONTAL,
    //   active: markdownPreview === PreviewModes.HORIZONTAL,
    //   iconComponent: <SvgIcon icon="layoutH" />
    // }
  ];

  const onOutsideClick = evt => {
    evt.stopPropagation();
    setClickedOutside(true);
  };

  const textTooShort = isTextTooShort(column, markdown);
  const shouldCatchOutsideClick = textTooShort;
  const errorCssClass =
    clickedOutside && textTooShort ? "markdown-editor_error" : "";

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
        {shouldCatchOutsideClick && (
          <div className="catchOutsideClick" onClick={onOutsideClick} />
        )}
        <div className={`cm-wrapper ${errorCssClass}`}>
          <CodeMirror
            ref={editorRef}
            value={markdown}
            onChange={handleChange}
            options={editorOptions}
            autoFocus={true}
          />
          <div className="length-limits">
            <div className={`min-length ${errorCssClass}`}>
              {minLengthText}{" "}
            </div>
            <div className="max-length">{maxLengthText} </div>
          </div>
        </div>
        <div className="plain-markdown-editor__preview">
          <div className="plain-markdown-editor-preview__react-markdown">
            <ReactMarkdown source={markdown} />
          </div>
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
  controlButtons: PropTypes.element
};
