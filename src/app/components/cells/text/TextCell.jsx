import f from "lodash/fp";
import React, { useEffect } from "react";
import "../../../../scss/main.scss";
import { canUserChangeCell } from "../../../helpers/accessManagementHelper";
import { getTableDisplayName } from "../../../helpers/multiLanguage";
import MarkdownEditor from "../../markdownEditor/MarkdownEditor";
import Header from "../../overlay/Header";
import ExpandButton from "./ExpandButton.jsx";
import TextEditOverlay from "./TextEditOverlay";

const TextCell = props => {
  const {
    actions,
    cell,
    table,
    langtag,
    displayValue,
    editing,
    selected,
    value
  } = props;
  const isMultiLine = f.contains("\n", displayValue[langtag]);

  useEffect(() => {
    if (editing) {
      const editable = canUserChangeCell(cell, langtag);
      const context = getTableDisplayName(table, langtag);
      const isRichText = cell.column.kind === "richtext";

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
      actions.toggleCellEditing({ editing: false });
    }
  }, [editing, value]);

  const handleSetEditing = () => {
    actions.toggleCellEditing({ editing: true });
  };

  return (
    <>
      <div className={`cell-content ${isMultiLine ? "is-multiline" : ""}`}>
        <div>{displayValue[langtag].split("\n")[0]}</div>
        {isMultiLine ? (
          <i className="fa fa-paragraph multiline-indicator" />
        ) : null}
      </div>
      {selected ? <ExpandButton onTrigger={handleSetEditing} /> : null}
    </>
  );
};

export default TextCell;
