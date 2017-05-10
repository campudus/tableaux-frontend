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

import * as f from "lodash/fp";

@connectToAmpersand
class View extends Component {

  static propTypes = {
    cell: PropTypes.object.isRequired,
    langtag: PropTypes.string.isRequired,
    setTranslationView: PropTypes.func.isRequired,
    hasFocusedChild: PropTypes.bool.isRequired,
    funcs: PropTypes.object.isRequired,
    popupOpen: PropTypes.bool.isRequired
  };

  shouldComponentUpdate(nextProps, nextState) { // don't re-render when only functions changed
    const pKeys = f.keys(this.props);
    const sKeys = f.keys(this.state);
    const pDiffs = pKeys.filter(k => this.props[k] !== nextProps[k]);
    const sDiffs = sKeys.filter(k => this.state[k] !== nextState[k]);
    const diffs = [...pDiffs, ...sDiffs];
    return !(diffs.length === 1 && f.first(diffs) === "funcs");
  }

  constructor(props) {
    super(props);
    this.props.watch(this.props.cell, {events: "change:annotations", force: true});
    this.props.watch(this.props.cell, {events: "change:value", force: true});
    this.state = {hovered: false};
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
    const {cell, cell:{row,kind}, funcs, setTranslationView} = this.props;
    const translationContent = (canConvert(kind, ColumnKinds.text))
      ? cell
      : {column: prop("column", cell), id: cell.id};
    funcs.focus(funcs.id);
    funcs.setTranslationItem(this.viewElement);
    setTranslationView({cell: translationContent});
    if (!this.canEditValue() && this.canEditValue(Symbol("theoretically"))) {
      askForSessionUnlock(row);
    }
  };

  render() {
    const {cell, funcs, langtag, setTranslationView, hasFocusedChild} = this.props;
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
    const viewClass = classNames(`view item ${this.getViewKind()} ${this.getViewId()}`, {
      "disabled": isDisabled,
      "has-focused-child": hasFocusedChild,
      "has-mouse-pointer": this.state.hovered
    });
    const description = prop(["description", langtag], column) || prop(["description", FallbackLanguage], column);

    return (
      <div className={viewClass}
           onClick={this.clickHandler}
           onMouseEnter={() => this.setState({hovered: true})}
           onMouseLeave={() => this.setState({hovered: false})}
           ref={el => { this.viewElement = el; }}
      >
        <RowHeadline column={column} langtag={langtag} cell={cell}
                     setTranslationView={setTranslationView}
                     funcs={f.assoc("viewElement", this.viewElement, this.props.funcs)}
                     thisUserCantEdit={isDisabled}
                     popupOpen={this.props.popupOpen}
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