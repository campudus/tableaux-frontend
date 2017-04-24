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
import {always, cond, isEmpty, prop, stubTrue} from "lodash/fp";
import {canConvert} from "../../helpers/cellValueConverter";
import * as Access from "../../helpers/accessManagementHelper";
import * as Annotations from "../../helpers/annotationHelper";
import {getCountryOfLangtag} from "../../helpers/multiLanguage";
import classNames from "classnames";
import askForSessionUnlock from "../helperComponents/SessionUnlockDialog";

@connectToAmpersand
class View extends Component {

  static propTypes = {
    cell: PropTypes.object.isRequired,
    langtag: PropTypes.string.isRequired,
    setTranslationView: PropTypes.func.isRequired,
    funcs: PropTypes.object.isRequired
  };

  constructor(props) {
    super(props);
    this.props.watch(this.props.cell, {events: "change:annotations", force: true});
  }

  getViewKind() {
    return `view-${this.props.cell.kind}`;
  }

  getViewId(someCell) {
    const cell = someCell || this.props.cell;
    return `view-${cell.column.getId()}-${cell.rowId}`;
  }

  canEditValue = theoretically => {
    const {cell, langtag} = this.props;
    const canEditUnlocked = Access.isUserAdmin() ||
      (Access.canUserChangeCell(cell)
      && cond([
        [() => cell.isMultiLanguage, always(Access.hasUserAccessToLanguage(langtag))],
        [() => cell.isMultiCountry, always(Access.hasUserAccessToCountryCode(getCountryOfLangtag(langtag)))],
        [stubTrue, always(false)]                // Non-admins can't change single-value items
      ])());
    return (theoretically)
      ? canEditUnlocked
      : canEditUnlocked && (!Annotations.isLocked(cell.row) || Annotations.isTranslationNeeded(langtag)(cell))
  };

  clickHandler = () => {
    const {cell:{row}, funcs} = this.props;
    funcs.focus(funcs.id);
    if (!this.canEditValue() && this.canEditValue(Symbol("theoretically"))) {
      askForSessionUnlock(row);
    }
  };

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

    const isDisabled = !this.canEditValue();

    const CellKind = views[kind];
    const viewClass = classNames(`view item ${this.getViewKind()} ${this.getViewId()}`, {"disabled": isDisabled});
    const description = prop(["description", langtag], column) || prop(["description", FallbackLanguage], column);
    const translationContent = (canConvert(kind, ColumnKinds.text))
      ? cell
      : {column: prop("column", cell)};

    return (
      <div className={viewClass}
           onMouseEnter={() => setTranslationView({cell: translationContent})}
           onClick={this.clickHandler}
      >
        <RowHeadline column={column} langtag={langtag} cell={cell}
                     setTranslationView={setTranslationView}
                     funcs={this.props.funcs}
                     thisUserCantEdit={isDisabled}
        />
        {(!isEmpty(description)) ? <div className="item-description"><i className="fa fa-info-circle"/><div>{description}</div></div> : null}
        <CellKind cell={cell} langtag={langtag} time={cell.kind === ColumnKinds.datetime}
                  setTranslationView={setTranslationView}
                  funcs={this.props.funcs}
                  thisUserCantEdit={isDisabled}
        />
      </div>
    );
  }
}

export default View;