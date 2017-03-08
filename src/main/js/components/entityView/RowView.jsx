import React, {Component, PropTypes} from "react";
import {ColumnKinds} from "../../constants/TableauxConstants";
import ShortTextView from "./text/ShortTextView";
import TextView from "./text/TextView";
import NumericView from "./numeric/NumericView";
import BooleanView from "./boolean/BooleanView";
import LinkView from "./link/LinkView";
import AttachmentView from "./attachment/AttachmentView";
import CurrencyView from "./currency/CurrencyView";
import DateView from "./date/DateView";
import RowHeadline from "./RowHeadline";
import connectToAmpersand from "../helperComponents/connectToAmpersand";

@connectToAmpersand
class View extends Component {

  static propTypes = {
    cell: PropTypes.object.isRequired,
    langtag: PropTypes.string.isRequired,
    tabIdx: PropTypes.number
  };

  render() {
    let cellKind = null;
    const {cell, langtag, tabIdx} = this.props;
    const kind = this.props.cell.kind;
    const column = this.props.cell.column;

    const views = {
      [ColumnKinds.link]: LinkView,
      [ColumnKinds.attachment]: AttachmentView,
      [ColumnKinds.numeric]: NumericView,
      [ColumnKinds.boolean]: BooleanView,
      [ColumnKinds.date]: DateView,
      [ColumnKinds.datetime]: DateView,
      [ColumnKinds.shorttext]: ShortTextView,
      [ColumnKinds.currency]: CurrencyView,
      [ColumnKinds.text]: TextView,
      [ColumnKinds.richtext]: TextView
    };

    const CellKind = views[cell.kind];

    let viewClass = "view" + " view-" + kind + " view-" + cell.column.getId() + "-" + cell.rowId;

    return (
      <div className={viewClass}>
        <RowHeadline column={column} langtag={langtag} />
        <div className="view-column">
        <CellKind tabIdx={tabIdx} cell={cell} langtag={langtag} time={cell.kind === ColumnKinds.datetime} />
        </div>
      </div>
    );
  }
}

module.exports = View;
