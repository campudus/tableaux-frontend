import React, {Component, PropTypes} from "react";
import {ColumnKinds, FallbackLanguage} from "../../constants/TableauxConstants";
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
import {isEmpty, prop} from "lodash/fp";
import {canConvert} from "../../helpers/cellValueConverter";

@connectToAmpersand
class View extends Component {

  static propTypes = {
    cell: PropTypes.object.isRequired,
    langtag: PropTypes.string.isRequired,
    setTranslationView: PropTypes.func.isRequired
  };

  getViewKind() {
    return `view-${this.props.cell.kind}`;
  }

  getViewId(someCell) {
    const cell = someCell || this.props.cell;
    return `view-${cell.column.getId()}-${cell.rowId}`;
  }

  render() {
    const {cell, langtag, setTranslationView} = this.props;
    const {kind, column} = cell;
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

    const CellKind = views[kind];
    const viewClass = `view item ${this.getViewKind()} ${this.getViewId()}`;
    const description = prop(["description", langtag], column) || prop(["description", FallbackLanguage], column);
    const translationContent = (canConvert(kind, ColumnKinds.text))
      ? cell
      : {column: prop("column", cell)};

    return (
      <div className={viewClass} onMouseEnter={() => setTranslationView({cell: translationContent})}>
        <RowHeadline column={column} langtag={langtag} cell={cell}
                     setTranslationView={setTranslationView}
        />
        {(!isEmpty(description)) ? <div className="item-description"><i className="fa fa-info-circle"/><div>{description}</div></div> : null}
        <CellKind cell={cell} langtag={langtag} time={cell.kind === ColumnKinds.datetime}
                  focusNextItem={() => console.log("Focus next")}
                  focusPreviousItem={() => console.log("Focus prev")}
                  setTranslationView={setTranslationView}
        />
      </div>
    );
  }
}

export default View;