import classNames from "classnames";
import i18n from "i18next";
import * as f from "lodash/fp";
import { match, otherwise, when as on } from "match-iz";
import PropTypes from "prop-types";
import React, { PureComponent } from "react";
import { ColumnKinds, Langtags } from "../../constants/TableauxConstants";
import * as Access from "../../helpers/accessManagementHelper";
import * as Annotations from "../../helpers/annotationHelper";
import { unless } from "../../helpers/functools";
import {
  getCountryOfLangtag,
  retrieveTranslation
} from "../../helpers/multiLanguage";
import Spinner from "../header/Spinner";
import { connectOverlayToCellValue } from "../helperComponents/connectOverlayToCellHOC";
import AttachmentView from "./attachment/AttachmentView";
import BooleanView from "./boolean/BooleanView";
import CurrencyView from "./currency/CurrencyView";
import DateView from "./date/DateView";
import GroupView from "./group/GroupView";
import LinkView from "./link/LinkView";
import NumericView from "./numeric/NumericView";
import RowHeadline from "./RowHeadline";
import StatusView from "./status/StatusView";
import ShortTextView from "./text/ShortTextView";
import TextView from "./text/TextView";

class View extends PureComponent {
  static propTypes = {
    cell: PropTypes.object.isRequired,
    langtag: PropTypes.string.isRequired,
    setTranslationView: PropTypes.func.isRequired,
    hasFocusedChild: PropTypes.bool.isRequired,
    funcs: PropTypes.object.isRequired,
    popupOpen: PropTypes.bool.isRequired,
    lockStatus: PropTypes.bool
  };

  constructor(props) {
    super(props);
    this.state = { hovered: false };
  }

  getViewKind() {
    return `view-${this.props.cell.kind}`;
  }

  getViewId(someCell) {
    const cell = someCell || this.props.cell;
    return `view-${cell.column.kind}-${cell.id}`;
  }

  componentDidCatch() {}

  canEditValue = theoretically => {
    const { cell, langtag } = this.props;
    const langtagOrCountry = f.propEq(["column", "languageType"], "country")(
      cell
    )
      ? getCountryOfLangtag(langtag)
      : langtag;
    const canEditUnlocked = Access.canUserChangeCell(cell, langtagOrCountry);
    return theoretically
      ? canEditUnlocked
      : canEditUnlocked &&
          (!Annotations.isLocked(cell.row) ||
            Annotations.isTranslationNeeded(langtag)(cell));
  };

  clickHandler = () => {
    const { cell, funcs, setTranslationView } = this.props;
    funcs.focus(funcs.id);
    funcs.setTranslationItem(this.viewElement);
    setTranslationView({ cell });
    if (!this.canEditValue() && this.canEditValue("theoretically")) {
      funcs.hintUnlockButton();
    }
  };

  render() {
    const {
      actions,
      cell,
      grudData,
      langtag, // for view content
      uiLangtag, // for view headers
      setTranslationView,
      hasFocusedChild,
      lockStatus: isLocked
    } = this.props;

    if (!cell || !cell.column) {
      // This can happen when a request to load columns initially resets the
      // column for the fraction of a second
      return <Spinner />;
    }

    const { kind, column } = cell;
    const views = {
      [ColumnKinds.link]: LinkView,
      [ColumnKinds.attachment]: AttachmentView,
      [ColumnKinds.numeric]: NumericView,
      [ColumnKinds.integer]: NumericView,
      [ColumnKinds.boolean]: BooleanView,
      [ColumnKinds.date]: DateView,
      [ColumnKinds.datetime]: DateView,
      [ColumnKinds.shorttext]: ShortTextView,
      [ColumnKinds.currency]: CurrencyView,
      [ColumnKinds.text]: TextView,
      [ColumnKinds.richtext]: TextView,
      [ColumnKinds.group]: GroupView,
      [ColumnKinds.status]: StatusView
    };

    const isDisabled = match(kind)(
      on(ColumnKinds.status, true),
      on(ColumnKinds.group, false),
      otherwise(!this.canEditValue() || isLocked)
    );

    const isMyTranslationNeeded =
      langtag !== f.first(Langtags) &&
      Annotations.isTranslationNeeded(langtag)(cell);
    const isAnyTranslationNeeded =
      langtag === f.first(Langtags) &&
      !f.isEmpty(f.get(["annotations", "translationNeeded", "langtags"], cell));
    const CellKind = views[kind];
    const viewClass = classNames(
      `view item ${this.getViewKind()} ${this.getViewId()}`,
      {
        disabled: isDisabled,
        "has-focused-child": hasFocusedChild,
        "has-mouse-pointer": this.state.hovered
      }
    );
    const description = unless(f.isNil, retrieveTranslation(langtag))(
      column.description
    );

    const translationTag =
      isMyTranslationNeeded || isAnyTranslationNeeded ? (
        <button
          className="action-item translation"
          onClick={evt => {
            evt.stopPropagation();
            setTranslationView({
              cell,
              show: true
            });
          }}
        >
          {isMyTranslationNeeded
            ? i18n.t("table:translations.this_translation_needed", {
                langtag
              })
            : i18n.t("table:translations.translation_needed")}
        </button>
      ) : null;

    const tagList = ["important", "check-me", "postpone"]
      .map(tagName =>
        cell.annotations && cell.annotations[tagName] ? (
          <span key={tagName} className={`action-item ${tagName}`}>
            {i18n.t(`table:${tagName}`)}
          </span>
        ) : null
      )
      .filter(f.identity);

    const itemKey = `${cell.table.id}-${cell.column.id}-${cell.row.id}`;

    return (
      <div
        key={itemKey}
        className={viewClass}
        onClick={this.clickHandler}
        onMouseEnter={() => this.setState({ hovered: true })}
        onMouseLeave={() => this.setState({ hovered: false })}
        ref={el => {
          this.viewElement = el;
        }}
      >
        <RowHeadline
          actions={actions}
          column={column}
          langtag={uiLangtag}
          cell={cell}
          setTranslationView={setTranslationView}
          funcs={f.assoc("viewElement", this.viewElement, this.props.funcs)}
          thisUserCantEdit={isDisabled}
          popupOpen={this.props.popupOpen}
          hasMeaningfulLinks={this.props.hasMeaningfulLinks}
        />
        {!f.isEmpty(description) ? (
          <div className="item-description">
            <i className="fa fa-info-circle" />
            <div>{description}</div>
          </div>
        ) : null}
        <CellKind
          grudData={grudData}
          actions={actions}
          cell={cell}
          langtag={langtag}
          time={cell.kind === ColumnKinds.datetime}
          key={`${cell.id}-${
            cell.column.multilanguage
              ? f.get(["value", langtag], cell)
              : cell.value
          }-${langtag}`}
          setTranslationView={setTranslationView}
          funcs={this.props.funcs}
          thisUserCantEdit={isDisabled}
          value={
            cell.column.multilanguage && cell.column.languageType !== "country"
              ? f.get(langtag, cell.value)
              : cell.value
          }
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

export default connectOverlayToCellValue(View);
