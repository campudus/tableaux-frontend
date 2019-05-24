import React from "react";
import TextEditOverlay from "./TextEditOverlay";
import ExpandButton from "./ExpandButton.jsx";
import f from "lodash/fp";
import { FallbackLanguage } from "../../../constants/TableauxConstants";
import Header from "../../overlay/Header";
import { doto } from "../../../helpers/functools";

import "../../../../scss/main.scss";
import { withHandlers } from "recompose";

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

      actions.openOverlay({
        head: <Header context={context} langtag={langtag} />,
        body:
          cell.column.kind === "richtext" ? (
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
        type: "full-height"
      });
    }
  }
});

export default enhance(TextCell);
