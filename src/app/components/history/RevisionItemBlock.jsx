import f from "lodash/fp";
import PropTypes from "prop-types";
import React from "react";
import { buildClassName } from "../../helpers/buildClassName";
import { mapIndexed } from "../../helpers/functools";
import { formatDate } from "../../helpers/multiLanguage";
import { cellSpec } from "../../specs/cell-spec";
import { validateProp } from "../../specs/type";
import RevisionItem from "./RevisionItem";

const RevisionItemBlock = props => {
  const { langtag, date, cell } = props;
  const revisions = f.compose(
    f.reverse,
    mapIndexed((rev, idx) => {
      return {
        ...rev,
        isConsecutive: idx === 0 || rev.idx === props.revisions[idx - 1].idx + 1
      };
    })
  )(props.revisions);
  const wrapperClass = buildClassName("revision__block", {
    [cell.column.kind]: true,
    "current-value": props.idx === 0
  });
  return (
    <div className={wrapperClass}>
      {date && date !== "null" && (
        <div className="revision__content">
          <div className="revision-block__header">
            <div className="revision-block__header-date">
              {formatDate(date)}
            </div>

            <div className="revision-block__header-separator" />
          </div>
        </div>
      )}
      {revisions.map((rev, idx) => (
        <RevisionItem
          idx={idx + props.idx}
          cell={cell}
          langtag={langtag}
          revision={rev}
          key={rev.revision || "0"}
        />
      ))}
    </div>
  );
};

export default RevisionItemBlock;
RevisionItemBlock.propTypes = {
  date: PropTypes.string,
  langtag: PropTypes.string.isRequired,
  revisions: PropTypes.array.isRequired,
  cell: validateProp(cellSpec)
};
