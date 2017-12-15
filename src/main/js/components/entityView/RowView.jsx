import React, {Component} from "react";
import PropTypes from "prop-types";
import {ColumnKinds, FallbackLanguage, Langtags} from "../../constants/TableauxConstants";
import ShortTextView from "./text/ShortTextView";
import TextView from "./text/TextView";
import NumericView from "./numeric/NumericView";
import BooleanView from "./boolean/BooleanView";
import LinkView from "./link/LinkView";
import AttachmentView from "./attachment/AttachmentView";
import CurrencyView from "./currency/CurrencyView";
import DateView from "./date/DateView";
import GroupView from "./group/GroupView";
import RowHeadline from "./RowHeadline";
import connectToAmpersand from "../helperComponents/connectToAmpersand";
import * as f from "lodash/fp";
import * as Access from "../../helpers/accessManagementHelper";
import * as Annotations from "../../helpers/annotationHelper";
import {getCountryOfLangtag} from "../../helpers/multiLanguage";
import classNames from "classnames";
import i18n from "i18next";

@connectToAmpersand
class View extends Component {
  static propTypes = {
    cell: PropTypes.object.isRequired,
    langtag: PropTypes.string.isRequired,
    setTranslationView: PropTypes.func.isRequired,
    hasFocusedChild: PropTypes.bool.isRequired,
    funcs: PropTypes.object.isRequired,
    popupOpen: PropTypes.bool.isRequired,
    lockStatus: PropTypes.any // just to signal a neccessary re-render when row (un-)locked
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
    this.props.watch(this.props.cell,
      {
        events: "change:annotations",
        force: true
      });
    this.props.watch(this.props.cell,
      {
        events: "change:value",
        force: true
      });
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
    const canEditUnlocked = Access.isUserAdmin()
      || (Access.canUserChangeCell(cell)
      && f.cond([
        [() => cell.isMultiLanguage, f.always(Access.hasUserAccessToLanguage(langtag))],
        [() => cell.isMultiCountry, f.always(Access.hasUserAccessToCountryCode(getCountryOfLangtag(langtag)))],
        [f.stubTrue, f.always(false)] // Non-admins can't change single-value items
      ])());
    return (theoretically)
      ? canEditUnlocked
      : canEditUnlocked && (!Annotations.isLocked(cell.row) || Annotations.isTranslationNeeded(langtag)(cell));
  };

  clickHandler = () => {
    const {cell, funcs, setTranslationView} = this.props;
    funcs.focus(funcs.id);
    funcs.setTranslationItem(this.viewElement);
    setTranslationView({cell});
    if (!this.canEditValue() && this.canEditValue("theoretically")) {
      funcs.hintUnlockButton();
    }
  };

  render() {
    const {cell, langtag, setTranslationView, hasFocusedChild} = this.props;
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
      [ColumnKinds.richtext]: TextView,
      [ColumnKinds.group]: GroupView
    };

    const isDisabled = !this.canEditValue();
    const isMyTranslationNeeded = langtag !== f.first(Langtags) && Annotations.isTranslationNeeded(langtag)(cell);
    const isAnyTranslationNeeded = langtag === f.first(Langtags)
      && !f.isEmpty(f.get(["annotations", "translationNeeded", "langtags"], cell));
    const CellKind = views[kind];
    const viewClass = classNames(`view item ${this.getViewKind()} ${this.getViewId()}`, {
      "disabled": isDisabled,
      "has-focused-child": hasFocusedChild,
      "has-mouse-pointer": this.state.hovered
    });
    const description = f.get(["description", langtag], column) || f.get(["description", FallbackLanguage], column);

    const translationTag = (isMyTranslationNeeded || isAnyTranslationNeeded)
      ? (
        <span className="action-item translation" onClick={evt => {
          evt.stopPropagation();
          setTranslationView({
            cell,
            show: true
          });
        }}>
          <a className="content">
            {(isMyTranslationNeeded)
              ? i18n.t("table:translations.this_translation_needed", {langtag})
              : i18n.t("table:translations.translation_needed")
            }
          </a>
        </span>
      )
      : null;

    const tagList = ["important", "check-me", "postpone"]
      .map(
        (tagName) => (cell.annotations && cell.annotations[tagName])
          ? <span key={tagName} className={`action-item ${tagName}`}>{i18n.t(`table:${tagName}`)}</span>
          : null
      )
      .filter(f.identity);

    return (
      <div className={viewClass}
           onClick={this.clickHandler}
           onMouseEnter={() => this.setState({hovered: true})}
           onMouseLeave={() => this.setState({hovered: false})}
           ref={el => {
             this.viewElement = el;
           }}
      >
        <RowHeadline column={column} langtag={langtag} cell={cell}
                     setTranslationView={setTranslationView}
                     funcs={f.assoc("viewElement", this.viewElement, this.props.funcs)}
                     thisUserCantEdit={isDisabled}
                     popupOpen={this.props.popupOpen}
                     hasMeaningfulLinks={this.props.hasMeaningfulLinks}
        />
        {(!f.isEmpty(description)) ? <div className="item-description"><i className="fa fa-info-circle" />
          <div>{description}</div>
        </div> : null}
        <CellKind cell={cell} langtag={langtag} time={cell.kind === ColumnKinds.datetime}
                  key={`${cell.id}-${(cell.isMultiLanguage) ? f.get(["value", langtag], cell) : cell.value}-${langtag}`}
                  setTranslationView={setTranslationView}
                  funcs={this.props.funcs}
                  thisUserCantEdit={isDisabled}
                  value={(cell.isMultiLanguage) ? f.get(["value", langtag], cell) : cell.value}
        >
          <div className="action-tags">
            {translationTag}
            {tagList}
          </div>
        </CellKind>
      </div>
    );
  }
}

export default View;
