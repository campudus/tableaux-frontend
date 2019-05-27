import "../../../../scss/main.scss";

import { withHandlers } from "recompose";
import React from "react";
import f from "lodash/fp";

import { FallbackLanguage } from "../../../constants/TableauxConstants";
import { canUserChangeCell } from "../../../helpers/accessManagementHelper";
import { doto } from "../../../helpers/functools";
import ExpandButton from "./ExpandButton.jsx";
import Header from "../../overlay/Header";
import MarkdownEditor from "../../markdownEditor/MarkdownEditor";
import TextEditOverlay from "./TextEditOverlay";

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

      const context = doto(
        [
          table.displayName[langtag],
          table.displayName[FallbackLanguage],
          table.name
        ],
        f.compact,
        f.first,
        ctx => (f.isString(ctx) ? ctx : f.toString(ctx))
      );

      const isRichText = cell.column.kind === "richtext";

      actions.openOverlay({
        head: <Header context={context} langtag={langtag} />,
        body: isRichText ? (
          <MarkdownEditor
            actions={actions}
            value={value}
            langtag={langtag}
            cell={cell}
            readOnly={!canUserChangeCell(cell, langtag)}
          />
        ) : (
          <TextEditOverlay
            actions={actions}
            value={value}
            langtag={langtag}
            cell={cell}
            readOnly={!canUserChangeCell(cell, langtag)}
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
