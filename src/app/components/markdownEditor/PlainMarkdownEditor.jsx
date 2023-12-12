import classNames from "classnames";
import PropTypes from "prop-types";
import React from "react";
import CodeMirror from "@uiw/react-codemirror";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { languages } from "@codemirror/language-data";
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

const PlainMarkdownEditor = ({
  controlButtons,
  initialMarkdown,
  className,
  onChange,
  readOnly,
  cell: { column }
}) => {
  const [value, setValue] = React.useState(initialMarkdown || "");
  const [clickedOutside, setClickedOutside] = React.useState(false);

  const { minLength, maxLength } = column;
  const minLengthText = columnHasMinLength(column)
    ? i18n.t("table:text-length:min-length-full", { minLength })
    : "";
  const maxLengthText = columnHasMaxLength(column)
    ? `${getTextLength(value)}/${maxLength}`
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

  const handleChange = newValue => {
    setClickedOutside(false);
    setValue(newValue);
    onChange(newValue);
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

  const textTooShort = isTextTooShort(column, value);
  const shouldCatchOutsideClick = textTooShort;
  const textTooShortErrorCssClass =
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
        <div className={`cm-wrapper ${textTooShortErrorCssClass}`}>
          <CodeMirror
            height="800px"
            value={value}
            onChange={handleChange}
            autoFocus={true}
            basicSetup={{ lineNumbers: false, foldGutter: false }}
            extensions={[
              markdown({ base: markdownLanguage, codeLanguages: languages })
            ]}
          />
          <div className="length-limits">
            <div className={`min-length ${textTooShortErrorCssClass}`}>
              {minLengthText}{" "}
            </div>
            <div className="max-length">{maxLengthText} </div>
          </div>
        </div>
        <div className="plain-markdown-editor__preview">
          <div className="plain-markdown-editor-preview__react-markdown">
            <ReactMarkdown source={value} />
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
