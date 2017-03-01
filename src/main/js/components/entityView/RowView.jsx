import React, {Component, PropTypes} from "react";
import connectToAmpersand from "../helperComponents/connectToAmpersand";
import {ColumnKinds} from "../../constants/TableauxConstants";
import ShortTextView from "./text/ShortTextView";
import TextView from "./text/TextView";
import NumericView from "./numeric/NumericView";
import BooleanView from "./boolean/BooleanView";
import LinkView from "./link/LinkView";
import AttachmentView from "./attachment/AttachmentView";
import CurrencyView from "./currency/CurrencyView";
import DateTimeView from "./datetime/DateTimeView";
import RowHeadline from "./RowHeadline";

var View = React.createClass({
  mixins: [AmpersandMixin],

  static propTypes = {
    cell: React.PropTypes.object.isRequired,
    langtag: React.PropTypes.string.isRequired,
    tabIdx: React.PropTypes.number
  };

  render() {
    let cellKind = null;
    const {cell, langtag, tabIdx} = this.props;

    const kind = this.props.cell.kind;

    const column = this.props.cell.column;

    switch (kind) {

      case ColumnKinds.link:
        cellKind = <LinkView tabIdx={tabIdx} cell={cell} langtag={langtag} />;
        break;

      case ColumnKinds.attachment:
        cellKind = <AttachmentView tabIdx={tabIdx} cell={cell} langtag={langtag} />;
        break;

      case ColumnKinds.numeric:
        cellKind = <NumericView tabIdx={tabIdx} cell={cell} langtag={langtag} />;
        break;

      case ColumnKinds.boolean:
        cellKind = <BooleanView tabIdx={tabIdx} cell={cell} langtag={langtag} />;
        break;

      case ColumnKinds.date:
        cellKind = <DateView tabIdx={tabIdx} cell={cell} langtag={langtag} />;
        break;

      case ColumnKinds.datetime:
        cellKind = <DateView tabIdx={tabIdx} cell={cell} langtag={langtag} time={true} />;
        break;

      case ColumnKinds.shorttext:
        cellKind = <ShortTextView tabIdx={tabIdx} cell={cell} langtag={langtag} />;
        break;

      case ColumnKinds.currency:
        cellKind = <CurrencyView tabIdx={tabIdx} cell={cell} langtag={langtag} />;
        break;

      default:
        cellKind = <TextView tabIdx={tabIdx} cell={cell} langtag={langtag} />;
        break;
    }

    let viewClass = "view" + " view-" + kind + " view-" + cell.column.getId() + "-" + cell.rowId;

    return (
      <div className={viewClass}>
        <RowHeadline column={column} langtag={langtag} />
        <div className="view-column">
          {cellKind}
        </div>
      </div>
    );
  }
}

module.exports = View;
