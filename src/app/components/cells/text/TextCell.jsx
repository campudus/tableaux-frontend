import f from "lodash/fp";
import React from "react";
import { canUserChangeCell } from "../../../helpers/accessManagementHelper";
import { getTableDisplayName } from "../../../helpers/multiLanguage";
import MarkdownEditor from "../../markdownEditor/MarkdownEditor";
import Header from "../../overlay/Header";
import ExpandButton from "./ExpandButton.jsx";
import TextEditOverlay from "./TextEditOverlay";

const TextCell = props => {
  const { actions, cell, table, langtag, displayValue, selected } = props;
  const isMultiLine = f.contains("\n", displayValue[langtag]);

  const handleExpandContent = () => {
    const editable = canUserChangeCell(cell, langtag);
    const context = getTableDisplayName(table, langtag);
    const isRichText = cell.column.kind === "richtext";
    const showFullContent = () =>
      actions.openOverlay({
        head: <Header context={context} langtag={langtag} />,
        body: isRichText ? (
          <MarkdownEditor {...props} readOnly={!editable} />
        ) : (
          <TextEditOverlay {...props} readOnly={!editable} />
        ),
        title: cell,
        type: "full-height",
        classes: isRichText ? "text-editor-overlay" : ""
      });

    if (selected) showFullContent();
    if (editable) actions.toggleCellEditing({ editing: false });
  };

  return (
    <>
      <div
        className={`cell-content ${isMultiLine ? "is-multiline" : ""}`}
        onClick={handleExpandContent}
      >
        <div>{displayValue[langtag].split("\n")[0]}</div>
        {isMultiLine ? (
          <i className="fa fa-paragraph multiline-indicator" />
        ) : null}
      </div>
      {selected ? <ExpandButton onTrigger={handleExpandContent} /> : null}
    </>
  );
};

export default TextCell;
