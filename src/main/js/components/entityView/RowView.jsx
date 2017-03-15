import React from "react";
import AmpersandMixin from "ampersand-react-mixin";
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

  propTypes: {
    cell: React.PropTypes.object.isRequired,
    langtag: React.PropTypes.string.isRequired
  },

  render: function () {
    let cellKind = null;
    const {cell, langtag} = this.props;

    const kind = this.props.cell.kind;

    const column = this.props.cell.column;

    switch (kind) {

      case ColumnKinds.link:
        cellKind = <LinkView cell={cell} langtag={langtag} />;
        break;

      case ColumnKinds.attachment:
        cellKind = <AttachmentView cell={cell} langtag={langtag} />;
        break;

      case ColumnKinds.numeric:
        cellKind = <NumericView cell={cell} langtag={langtag} />;
        break;

      case ColumnKinds.boolean:
        cellKind = <BooleanView cell={cell} langtag={langtag} />;
        break;

      case ColumnKinds.datetime:
        cellKind = <DateTimeView cell={cell} langtag={langtag} />;
        break;

      case ColumnKinds.shorttext:
        cellKind = <ShortTextView cell={cell} langtag={langtag} />;
        break;

      case ColumnKinds.currency:
        cellKind = <CurrencyView cell={cell} langtag={langtag} />;
        break;

      default:
        cellKind = <TextView cell={cell} langtag={langtag} />;
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
});

module.exports = View;
