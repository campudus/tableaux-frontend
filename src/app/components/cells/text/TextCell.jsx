import "../../../../scss/main.scss";

import { withHandlers } from "recompose";
import React from "react";
import f from "lodash/fp";

import { getTableDisplayName } from "../../../helpers/multiLanguage";
import ExpandButton from "./ExpandButton.jsx";
import Header from "../../overlay/Header";
import TextEditOverlay from "./TextEditOverlay";

import MarkdownEditor from "../../markdownEditor/MarkdownEditor";

const TextCell = props => {
  const { langtag, displayValue, selected, openEditOverlay } = props;
  const isMultiLine = f.contains("\n", displayValue[langtag]);

  return (
    <div
      className={`cell-content ${isMultiLine ? "is-multiline" : ""}`}
      onClick={openEditOverlay}
    >
      <div>{displayValue[langtag].split("\n")[0]}</div>
      {selected ? <ExpandButton onTrigger={openEditOverlay} /> : null}
      {isMultiLine ? (
        <i className="fa fa-paragraph multiline-indicator" />
      ) : null}
    </div>
  );
};

const enhance = withHandlers({
  openEditOverlay: props => event => {
    const { actions, selected, cell, table, langtag, value } = props;

    if (selected) {
      event && event.stopPropagation();

      const context = getTableDisplayName(table, langtag);

      const isRichText = cell.column.kind === "richtext";

      actions.openOverlay({
        head: <Header context={context} langtag={langtag} />,
        body: isRichText ? (
          <MarkdownEditor
            actions={actions}
            value={value}
            langtag={langtag}
            cell={cell}
          />
        ) : (
          <TextEditOverlay
            actions={actions}
            value={value}
            langtag={langtag}
            cell={cell}
          />
        ),
        title: cell,
        type: "full-height",
        classes: isRichText ? "text-editor-overlay" : ""
      });
    }
  }
});

export default enhance(TextCell);
