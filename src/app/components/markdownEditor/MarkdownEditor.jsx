import React from "react";

import PropTypes from "prop-types";
import classNames from "classnames";

import { StyleIcon } from "./StyleControls";
import { getTableDisplayName } from "../../helpers/multiLanguage";
import { useLocalStorage } from "../../helpers/useLocalStorage";
import EditorPanel from "./EditorPanel";
import Header from "../overlay/Header";
import PlainMarkdownEditor from "./PlainMarkdownEditor";
import actions from "../../redux/actionCreators";
import store from "../../redux/store";

const MarkdownEditors = {
  WYSIWYG: "WYSIWYG",
  DIRECT: "DIRECT"
};

const PreviewModes = {
  HORIZONTAL: "HORIZONTAL",
  VERTICAL: "VERTICAL",
  NONE: "NONE"
};

const MarkdownEditor = ({ value, cell, actions, langtag, readOnly }, ref) => {
  const isMultiLanguage = cell.column.multilanguage;
  const theMarkdown = React.useRef(
    (isMultiLanguage ? value[langtag] : value) || ""
  );

  const [preferredEditor, setPreferredEditor] = useLocalStorage(
    "markdownEditor",
    MarkdownEditors.DIRECT
  );

  const [markdownPreview, setMarkdownPreview] = useLocalStorage(
    "markdownPreview",
    PreviewModes.HORIZONTAL
  );

  const editorRef = React.useRef();
  React.useImperativeHandle(ref, () => ({
    focus: editorRef.current && editorRef.current.focus()
  }));

  const handleChange = React.useCallback(markdown => {
    theMarkdown.current = markdown;
  });

  const focusInput = React.useCallback(() => {
    editorRef.current && editorRef.current.focus && editorRef.current.focus();
  });

  React.useEffect(() => {
    const onUnmount = () => {
      actions.changeCellValue({
        oldValue: value,
        newValue: isMultiLanguage
          ? { [langtag]: theMarkdown.current }
          : theMarkdown.current,
        cell
      });
    };
    focusInput();
    return onUnmount;
  }, []);

  const UserEditor =
    preferredEditor === MarkdownEditors.WYSIWYG
      ? EditorPanel
      : PlainMarkdownEditor;

  const cssClass = classNames("markdown-editor", {
    "markdown-editor--disabled": readOnly,
    "markdown-editor--split-h":
      preferredEditor === MarkdownEditors.DIRECT &&
      markdownPreview === PreviewModes.HORIZONTAL,
    "markdown-editor--split-v":
      preferredEditor === MarkdownEditors.DIRECT &&
      markdownPreview === PreviewModes.VERTICAL,
    "markdown-editor--hide-preview":
      preferredEditor === MarkdownEditors.DIRECT &&
      markdownPreview === PreviewModes.NONE
  });

  const editorSelectorControls = [
    {
      key: MarkdownEditors.DIRECT,
      toggleStyle: setPreferredEditor,
      styleToToggle: MarkdownEditors.DIRECT,
      active: preferredEditor === MarkdownEditors.DIRECT,
      label: "PRO"
    },
    {
      key: MarkdownEditors.WYSIWYG,
      toggleStyle: setPreferredEditor,
      styleToToggle: MarkdownEditors.WYSIWYG,
      active: preferredEditor === MarkdownEditors.WYSIWYG,
      label: "NOOB"
    }
  ];

  const previewSelectorControls = [
    {
      key: PreviewModes.NONE,
      toggleStyle: setMarkdownPreview,
      styleToToggle: PreviewModes.NONE,
      active: markdownPreview === PreviewModes.NONE,
      label: "X"
    },
    {
      key: PreviewModes.VERTICAL,
      toggleStyle: setMarkdownPreview,
      styleToToggle: PreviewModes.VERTICAL,
      active: markdownPreview === PreviewModes.VERTICAL,
      label: "V"
    },
    {
      key: PreviewModes.HORIZONTAL,
      toggleStyle: setMarkdownPreview,
      styleToToggle: PreviewModes.HORIZONTAL,
      active: markdownPreview === PreviewModes.HORIZONTAL,
      icon: "fa-columns"
    }
  ];

  const editorControls =
    preferredEditor === MarkdownEditors.DIRECT
      ? [...previewSelectorControls, ...editorSelectorControls]
      : editorSelectorControls;

  return (
    <div className={cssClass} onClick={focusInput}>
      <UserEditor
        ref={editorRef}
        initialMarkdown={theMarkdown.current}
        onChange={handleChange}
        readOnly={readOnly}
        hideToolbar={readOnly}
        controlButtons={
          !readOnly && editorControls.map(button => <StyleIcon {...button} />)
        }
      />
    </div>
  );
};

export const openMarkdownEditor = ({
  cell,
  cell: { table, value },
  langtag,
  readOnly
}) => {
  const context = getTableDisplayName(table, langtag) || "";
  const editActions = {
    changeCellValue(...args) {
      store.dispatch(actions.changeCellValue(...args));
    }
  };
  const MarkdownEditorWithRef = React.forwardRef(MarkdownEditor);

  store.dispatch(
    actions.openOverlay({
      head: <Header context={context} langtag={langtag} />,
      body: (
        <MarkdownEditorWithRef
          actions={editActions}
          value={value}
          langtag={langtag}
          cell={cell}
          readOnly={!!readOnly}
        />
      ),
      title: cell,
      type: "full-height",
      classes: "text-editor-overlay"
    })
  );
};

export default React.forwardRef(MarkdownEditor);

MarkdownEditor.propTypes = {
  value: PropTypes.oneOf([PropTypes.object, PropTypes.string]),
  cell: PropTypes.object.isRequired,
  actions: PropTypes.object.isRequired,
  langtag: PropTypes.string.isRequired,
  readOnly: PropTypes.bool
};
