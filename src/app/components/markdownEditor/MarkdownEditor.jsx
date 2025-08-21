import React from "react";
import f from "lodash/fp";
import { useSelector } from "react-redux";

import PropTypes from "prop-types";
import classNames from "classnames";

import { StyleIcon } from "./StyleControls";
import { getTableDisplayName } from "../../helpers/multiLanguage";
import { ifElse } from "../../helpers/functools";
import EditorPanel from "./EditorPanel";
import Header from "../overlay/Header";
import PlainMarkdownEditor from "./PlainMarkdownEditor";
import actions from "../../redux/actionCreators";
import store from "../../redux/store";

const MarkdownEditors = {
  WYSIWYG: "WYSIWYG",
  DIRECT: "DIRECT"
};

const MarkdownEditor = ({ value, cell, actions, langtag, readOnly }, ref) => {
  const isMultiLanguage = cell.column.multilanguage;
  const theMarkdown = React.useRef(
    (isMultiLanguage ? value[langtag] : value) || ""
  );

  const preferredEditor = useSelector(
    f.prop("userSettings.global.markdownEditor")
  );

  const setPreferredEditor = editor => {
    actions.upsertUserSetting(
      { kind: "global", key: "markdownEditor" },
      { value: editor }
    );
  };

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
      const valueToSave = ifElse(
        f.isString,
        f.trim,
        () => "",
        theMarkdown.current
      );
      actions.changeCellValue({
        oldValue: value,
        newValue: isMultiLanguage ? { [langtag]: valueToSave } : valueToSave,
        cell
      });
    };
    focusInput();
    return onUnmount;
  }, []);

  const UserEditor =
    preferredEditor === MarkdownEditors.WYSIWYG && !readOnly
      ? EditorPanel
      : PlainMarkdownEditor;

  const cssClass = classNames("markdown-editor", {
    "markdown-editor--disabled": readOnly
  });

  const editorSelectorControls = [
    {
      key: MarkdownEditors.DIRECT,
      toggleStyle: setPreferredEditor,
      styleToToggle: MarkdownEditors.DIRECT,
      active: preferredEditor === MarkdownEditors.DIRECT,
      label: "Markdown"
    },
    {
      key: MarkdownEditors.WYSIWYG,
      toggleStyle: setPreferredEditor,
      styleToToggle: MarkdownEditors.WYSIWYG,
      active: preferredEditor === MarkdownEditors.WYSIWYG,
      label: "RichText"
    }
  ];

  return (
    <div className={cssClass} onClick={focusInput}>
      <UserEditor
        cell={cell}
        ref={editorRef}
        initialMarkdown={theMarkdown.current}
        onChange={handleChange}
        readOnly={readOnly}
        hideToolbar={readOnly}
        controlButtons={
          !readOnly && (
            <div className="toggle-editor-buttons">
              {editorSelectorControls.map((button, idx) => (
                <StyleIcon key={idx} {...button} />
              ))}
            </div>
          )
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
