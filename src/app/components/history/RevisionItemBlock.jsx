import React from "react";
import f from "lodash/fp";
import moment from "moment";

import PropTypes from "prop-types";

import { DateFormats } from "../../constants/TableauxConstants";
import { cellSpec } from "../../specs/cell-spec";
import { mapIndexed } from "../../helpers/functools";
import { validateProp } from "../../specs/type";
import RevisionItem from "./RevisionItem";

const RevisionItemBlock = props => {
  const { langtag, date, cell } = props;
  const revisions = f.compose(
    f.reverse,
    mapIndexed((rev, idx) => {
      idx > 0 &&
        console.log("revision", rev.idx, "=>", props.revisions[idx - 1].idx);
      return {
        ...rev,
        isConsecutive: idx === 0 || rev.idx === props.revisions[idx - 1].idx + 1
      };
    })
  )(props.revisions);
  return (
    <div className="revision-block">
      <div className="revision__item">
        <div className="revision-block__header">
          <div className="revision-block__header-date">
            {moment(date).format(DateFormats.formatForUser)}
          </div>
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
