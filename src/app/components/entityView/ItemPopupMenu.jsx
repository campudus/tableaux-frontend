import React, { Component } from "react";
import ReactDOM from "react-dom";
import f from "lodash/fp";
import i18n from "i18next";
import listenToClickOutside from "react-onclickoutside";

import PropTypes from "prop-types";
import classNames from "classnames";

import { ColumnKinds, Langtags } from "../../constants/TableauxConstants";
import {
  addTranslationNeeded,
  deleteCellAnnotation,
  setCellAnnotation,
  removeTranslationNeeded
} from "../../helpers/annotationHelper";
import { canConvert } from "../../helpers/cellValueConverter";
import { merge } from "../../helpers/functools";
import { openShowDependency } from "../overlay/ConfirmDependentOverlay";
import SvgIcon from "../helperComponents/SvgIcon";
import actions from "../../redux/actionCreators";
import store from "../../redux/store";
import pasteCellValue from "../../components/cells/cellCopyHelper";

@listenToClickOutside
class MenuPopup extends Component {
  static props = {
    clickOutside: PropTypes.func.isRequired,
    handleMouseEnter: PropTypes.func.isRequired,
    handleMouseLeave: PropTypes.func.isRequired,
    popupClass: PropTypes.string.isRequired
  };

  handleClickOutside(evt) {
    this.props.clickOutside(evt);
  }

  render() {
    return (
      <div
        className={this.props.popupClass}
        onMouseEnter={this.props.handleMouseEnter}
        onMouseLeave={this.props.handleMouseLeave}
      >
        {this.props.children}
      </div>
    );
  }
}

class ItemPopupMenu extends Component {
  static propTypes = {
    langtag: PropTypes.string.isRequired,
    cell: PropTypes.object.isRequired,
    setTranslationView: PropTypes.func.isRequired,
    funcs: PropTypes.object.isRequired,
    thisUserCantEdit: PropTypes.bool.isRequired
  };

  constructor(props) {
    super(props);
    this.state = {
      open: false,
      isOffScreen: false
    };
    this.nodeRef = null;
  }

  closePopup = () => {
    this.nodeRef = null;
    this.props.funcs.closeItemPopup();
  };

  mkEntry = (idx, { title, fn, value, icon, classes }) => {
    const clickHandler = f.flow(
      e => {
        e.stopPropagation();
      },
      fn,
      this.closePopup
    );
    return (
      <a className="entry" href="#" onClick={clickHandler}>
        <i className={classes || `fa fa-${icon}`} />
        <div>{value ? i18n.t(title, { langtag: value }) : i18n.t(title)}</div>
      </a>
    );
  };

  mkToggleFlagItem = flag => {
    const { cell } = this.props;
    const flagValue = f.get(["annotations", flag], cell);
    const toggleFn = flagValue
      ? () =>
          deleteCellAnnotation(
            { type: "flag", value: flag, uuid: flagValue },
            cell,
            "do-it!"
          )
      : () => setCellAnnotation({ type: "flag", value: flag }, cell);
    return this.mkEntry(flag, {
      fn: toggleFn,
      title: `table:${flag}`,
      classes: `dot ${flag} ${flagValue ? "active" : "inactive"}`
    });
  };

  isPrimaryLanguage = () => {
    const { langtag } = this.props;
    return langtag === f.first(Langtags);
  };

  needsTranslation = () => {
    const { cell, langtag } = this.props;
    const neededTranslations = f.get(
      ["annotations", "translationNeeded", "langtags"],
      cell
    );
    return (
      f.contains(langtag, neededTranslations) ||
      (this.isPrimaryLanguage() &&
        f.isEmpty(f.xor(neededTranslations, f.drop(1)(Langtags))))
    );
  };

  mkAddTranslationEntry = () => {
    const { cell, langtag } = this.props;
    if (this.needsTranslation()) {
      return null;
    }
    const neededTranslation = this.isPrimaryLanguage()
      ? f.drop(1, Langtags)
      : [
          ...(f.prop(["annotation", "translationNeeded", "langtags"], cell) ||
            []),
          langtag
        ];
    const text = this.isPrimaryLanguage()
      ? "table:translations.translation_needed"
      : "table:translations.this_translation_needed";
    return this.mkEntry(3, {
      title: text,
      value: !this.isPrimaryLanguage() ? langtag : null,
      fn: () => addTranslationNeeded(neededTranslation, cell),
      classes: "dot translation inactive"
    });
  };

  mkRemoveTranslationEntry = () => {
    const { cell, langtag } = this.props;
    const cellTranslationAnnotation = f.prop(
      ["annotations", "translationNeeded"],
      cell
    );
    const untranslated = f.get(["langtags"], cellTranslationAnnotation);
    if (!this.needsTranslation()) {
      return null;
    }
    const remaining = f.remove(f.eq(langtag), untranslated);
    const deleteAnnotationFn = cellTranslationAnnotation
      ? () =>
          deleteCellAnnotation(
            merge(cellTranslationAnnotation, {
              type: "flag",
              value: "translationNeeded"
            }),
            cell,
            true
          )
      : f.noop;
    return this.mkEntry(4, {
      title: this.isPrimaryLanguage()
        ? "table:translations.translation_needed"
        : "table:translations.this_translation_needed",
      value: langtag,
      fn:
        this.isPrimaryLanguage() || f.isEmpty(remaining)
          ? deleteAnnotationFn
          : () => removeTranslationNeeded(langtag, cell),
      classes: "dot translation active"
    });
  };

  componentDidUpdate() {
    if (!this.nodeRef) {
      return;
    }
    // Need real dom node for bounding rect
    // eslint-disable-next-line react/no-find-dom-node
    const nodeDOM = ReactDOM.findDOMNode(this.nodeRef);
    const elRect = nodeDOM.getBoundingClientRect();
    if (!this.state.isOffScreen && elRect.bottom > window.innerHeight) {
      this.setState({ isOffScreen: true });
    } else if (
      this.state.isOffScreen &&
      elRect.bottom + elRect.height < window.innerHeight
    ) {
      // if it won't be off-screen after resetting
      this.setState({ isOffScreen: false });
    }
  }

  render() {
    const { isOffScreen } = this.state;
    const {
      cell: { row },
      cell,
      langtag,
      popupOpen,
      thisUserCantEdit,
      hasMeaningfulLinks
    } = this.props;
    const buttonClass = classNames("popup-button", {
      "is-open": popupOpen,
      "menu-is-right": isOffScreen
    });
    const { enterItemPopupButton, leaveItemPopupButton } = this.props.funcs;
    const popupClass = classNames("entry-popup ignore-react-onclickoutside", {
      inverse: isOffScreen
    });
    const wrapperClass = classNames("entry-popup-wrapper");

    const copySource = f.prop(["tableView", "copySource"], store.getState());

    return (
      <div className={wrapperClass}>
        <div
          className={buttonClass}
          onMouseLeave={leaveItemPopupButton}
          onMouseDown={popupOpen ? f.noop : this.props.funcs.openItemPopup}
        >
          <a href="#">
            <SvgIcon icon="vdots" />
          </a>
        </div>
        {popupOpen ? (
          <MenuPopup
            popupClass={popupClass}
            handleMouseEnter={enterItemPopupButton}
            handleMouseLeave={leaveItemPopupButton}
            clickOutside={this.closePopup}
            ref={el => {
              this.nodeRef = el;
            }}
          >
            <div className="separator">{i18n.t("table:menus.data_set")}</div>
            {hasMeaningfulLinks
              ? this.mkEntry(0, {
                  title: "table:show_dependency",
                  fn: () =>
                    openShowDependency({
                      table: cell.table,
                      row,
                      langtag,
                      cell
                    }),
                  icon: "code-fork"
                })
              : null}
            {cell.kind !== ColumnKinds.status && this.mkEntry(1, {
              title: "table:copy_cell",
              fn: () =>
                store.dispatch(actions.copyCellValue({ cell, langtag })),
              icon: "files-o"
            })}
            {cell.kind === ColumnKinds.status || thisUserCantEdit
              ? null
              : this.mkEntry(2, {
                  title: "table:paste_cell",
                  fn: () =>
                    pasteCellValue(
                      copySource.cell,
                      copySource.langtag,
                      cell,
                      langtag
                    ),
                  icon: "clipboard"
                })}
            {this.mkToggleFlagItem("important")}
            {this.mkToggleFlagItem("check-me")}
            {this.mkToggleFlagItem("postpone")}
            {cell.column.multilanguage &&
            canConvert(cell.kind, ColumnKinds.text) ? (
              <div>
                <div className="separator">
                  {i18n.t("table:menus.translation")}
                </div>
                {this.mkAddTranslationEntry()}
                {this.mkRemoveTranslationEntry()}
                {this.mkEntry(5, {
                  title: "table:show_translation",
                  fn: () => {
                    this.props.setTranslationView({
                      show: true,
                      cell
                    });
                    this.props.funcs.setTranslationItem(
                      this.props.funcs.viewElement
                    );
                  },
                  icon: "flag"
                })}
              </div>
            ) : null}
          </MenuPopup>
        ) : null}
      </div>
    );
  }
}

export default ItemPopupMenu;
