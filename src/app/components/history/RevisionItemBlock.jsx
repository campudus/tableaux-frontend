import React from "react";

import PropTypes from "prop-types";

import { cellSpec } from "../../specs/cell-spec";
import { validateProp } from "../../specs/type";
import RevisionItem from "./RevisionItem";

const RevisionItemBlock = props => {
  const { langtag, date, cell } = props;
  const revisions = props.revisions.map((rev, idx) => {
    //    console.log(idx, rev);
    return {
      ...rev,
      isConsecutive: idx === 0 || rev.idx === props.revisions[idx - 1].idx + 1
    };
  });
  return (
    <div className="revision-block">
      <div className="revision__item">
        <div className="revision-block__header">
          <div className="revision-block__header-date">{date}</div>
          <div className="revision-block__header-separator" />
        </div>
      </div>
      {revisions.map(rev => (
        <RevisionItem
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
  date: PropTypes.string.isRequired,
  langtag: PropTypes.string.isRequired,
  revisions: PropTypes.array.isRequired,
  cell: validateProp(cellSpec)
};
