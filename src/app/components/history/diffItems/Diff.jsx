import React from "react";
import f from "lodash/fp";
import i18n from "i18next";

import PropTypes from "prop-types";

import { ColumnKinds } from "../../../constants/TableauxConstants";
import { where } from "../../../helpers/functools";
import CommentDiff from "./CommentDiff";
import CountryDiff from "./CountryDiff";
import FlagDiff from "./FlagDiff";
import LinkDiff from "./LinkDiff";
import RowCreatedDiff from "./RowCreatedDiff";
import TextDiff from "./TextDiff";
import NumberDiff from "./NumberDiff";

const Diff = props => {
  const TheDiff = f.cond([
    [f.propEq("event", "cell_changed"), () => ContentDiff],
    [where({ historyType: "row_flag" }), () => FlagDiff],
    [
      where({ event: "annotation_added", historyType: "cell_flag" }),
      () => FlagDiff
    ],
    [
      where({ event: "annotation_added", historyType: "cell_comment" }),
      () => CommentDiff
    ],
    [
      where({ event: "annotation_removed", historyType: "cell_flag" }),
      () => FlagDiff
    ],
    [
      where({ event: "annotation_removed", historyType: "cell_comment" }),
      () => CommentDiff
    ],

    [f.propEq("event", "row_created"), () => RowCreatedDiff],
    [f.stubTrue, () => UnknownEvent]
  ])(props.revision);

  return <TheDiff {...props} />;
};

const ContentDiff = props => {
  switch (props.cell.kind) {
    case ColumnKinds.link:
    case ColumnKinds.attachment:
      return <LinkDiff {...props} />;
    case ColumnKinds.currency:
      return <CountryDiff {...props} />;
    case ColumnKinds.numeric:
      return <NumberDiff {...props} isRevertable={props.revision.revertable} />;
    case ColumnKinds.text:
    case ColumnKinds.shorttext:
    case ColumnKinds.richtext:
    case ColumnKinds.date:
    case ColumnKinds.datetime:
    default:
      return <TextDiff {...props} isRevertable={props.revision.revertable} />;
  }
};

const UnknownEvent = props => {
  const { event, historyType } = props.revision;
  return (
    <div className="unknown-diff">
      <div className="unknown-diff__event">{i18n.t(`history:${event}`)}</div>
      <div className="unknown-diff__history-type">
        {i18n.t(`history:${historyType}`)}
      </div>
    </div>
  );
};

export default Diff;
Diff.propTypes = {
  diff: PropTypes.array.isRequired,
  cell: PropTypes.object.isRequired,
  revision: PropTypes.object.isRequired
};
