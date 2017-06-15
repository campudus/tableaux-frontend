import React, {Component, PropTypes} from "react";
import listenToClickOutside from "react-onclickoutside";
import classNames from "classnames";
import i18n from "i18next";
import ActionCreator from "../../actions/ActionCreator";
import * as f from "lodash/fp";
import {ColumnKinds, Langtags} from "../../constants/TableauxConstants";
import {addTranslationNeeded, deleteCellAnnotation, removeTranslationNeeded} from "../../helpers/annotationHelper";
import {openShowDependency} from "../overlay/ConfirmDependentOverlay";
import {canConvert} from "../../helpers/cellValueConverter";
import SvgIcon from "../helperComponents/SvgIcon";
import ReactDOM from "react-dom";

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
      <div className={this.props.popupClass}
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
      active: null,
      isOffScreen: false
    };
    this.nodeRef = null;
  }

  closePopup = () => {
    this.nodeRef = null;
    this.props.funcs.closeItemPopup();
  };

  mkEntry = (idx, {title, fn, value}) => {
    const entryClass = classNames("entry", {"active": this.state.active === idx});
    const clickHandler = f.compose(
      this.closePopup,
      fn,
      e => {
        e.stopPropagation();
      }
    );
    return (
      <div className={entryClass}
           onMouseEnter={() => this.setState({active: idx})}
           onClick={clickHandler}
      >
        <a href="#">
          {(value) ? i18n.t(title, {langtag: value}) : i18n.t(title)}
        </a>
      </div>
    );
  };

  isPrimaryLanguage = () => {
    const {langtag} = this.props;
    return (langtag === f.first(Langtags));
  };

  needsTranslation = () => {
    const {cell, langtag} = this.props;
    return f.contains(
      langtag,
      f.prop(["annotation", "needsTranslation", "langtags"], cell)
    );
  };

  mkAddTranslationEntry = () => {
    const {cell, langtag} = this.props;
    if (f.contains(langtag, f.prop(["annotations", "translationNeeded", "langtags"]))) {
      return null;
    }
    const neededTranslation = (this.isPrimaryLanguage())
      ? f.drop(1, Langtags)
      : [...(f.prop(["annotation", "needsTranslation", "langtags"], cell) || []), langtag];
    const text = (this.isPrimaryLanguage())
      ? "table:translations.translation_needed"
      : "table:translations.this_translation_needed";
    return this.mkEntry(3,
      {
        title: text,
        value: (!this.isPrimaryLanguage()) ? langtag : null,
        fn: () => addTranslationNeeded(neededTranslation, cell)
      });
  };

  mkRemoveTranslationEntry = () => {
    const {cell, langtag} = this.props;
    const cellTranslationAnnotation = f.prop(["annotations", "translationNeeded"], cell);
    const untranslated = f.prop("langtags", cell);
    if (!this.isPrimaryLanguage() && !f.contains(langtag, untranslated)) {
      return null;
    }
    const remaining = f.remove(f.eq(langtag), untranslated);
    const deleteAnnotationFn = (cellTranslationAnnotation)
      ? () => deleteCellAnnotation(f.merge(cellTranslationAnnotation,
        {
          type: "flag",
          value: "translationNeeded"
        }), cell, true)
      : f.noop;
    return this.mkEntry(4, {
      title: (this.isPrimaryLanguage())
        ? "table:translations.no_translation_needed"
        : "table:translations.no_such_translation_needed",
      value: langtag,
      fn: (this.isPrimaryLanguage() || f.isEmpty(remaining))
        ? deleteAnnotationFn
        : () => removeTranslationNeeded(langtag, cell)
    });
  };

  componentDidUpdate() {
    if (!this.nodeRef) {
      return;
    }
    const nodeDOM = ReactDOM.findDOMNode(this.nodeRef);
    const elRect = nodeDOM.getBoundingClientRect();
    if (!this.state.isOffScreen && elRect.bottom > window.innerHeight) {
      this.setState({isOffScreen: true});
    } else if (this.state.isOffScreen && elRect.bottom + elRect.height < window.innerHeight) { // if it won't be off-screen after resetting
      this.setState({isOffScreen: false});
    }
  };

  render() {
    const {isOffScreen} = this.state;
    const {cell: {row}, cell, langtag, popupOpen, thisUserCantEdit} = this.props;
    const buttonClass = classNames("popup-button", {
      "is-open": popupOpen,
      "menu-is-right": isOffScreen
    });
    const {enterItemPopupButton, leaveItemPopupButton} = this.props.funcs;
    const popupClass = classNames("entry-popup ignore-react-onclickoutside", {"inverse": isOffScreen});
    const wrapperClass = classNames("entry-popup-wrapper");

    return (
      <div className={wrapperClass}>
        <div className={buttonClass}
             onMouseLeave={leaveItemPopupButton}
             onMouseDown={(popupOpen) ? f.noop : this.props.funcs.openItemPopup}
        >
          <a href="#">
            <SvgIcon icon="vdots" />
          </a>
        </div>
        {(popupOpen)
          ? (
            <MenuPopup
              popupClass={popupClass}
              handleMouseEnter={enterItemPopupButton}
              handleMouseLeave={leaveItemPopupButton}
              clickOutside={this.closePopup}
              ref={el => {
                this.nodeRef = el;
              }}
            >
              <div className="separator">
                {i18n.t("table:menus.data_set")}
              </div>
              {this.mkEntry(0,
                {
                  title: "table:show_dependency",
                  fn: () => openShowDependency(row, langtag)
                })}
              {this.mkEntry(1,
                {
                  title: "table:copy_cell",
                  fn: () => ActionCreator.copyCellContent(cell, langtag)
                })}
              {(thisUserCantEdit)
                ? null
                : this.mkEntry(2,
                  {
                    title: "table:paste_cell",
                    fn: () => ActionCreator.pasteCellContent(cell, langtag)
                  })
              }
              {(cell.isMultiLanguage && canConvert(cell.kind, ColumnKinds.text))
                ? (
                  <div>
                    <div className="separator">
                      {i18n.t("table:menus.translation")}
                    </div>
                    {this.mkAddTranslationEntry()}
                    {this.mkRemoveTranslationEntry()}
                    {this.mkEntry(5,
                      {
                        title: "table:show_translation",
                        fn: () => {
                          this.props.setTranslationView({
                            show: true,
                            cell
                          });
                          this.props.funcs.setTranslationItem(this.props.funcs.viewElement);
                        }
                      })
                    }
                  </div>
                )
                : null
              }
            </MenuPopup>
          )
          : null
        }
      </div>
    );
  }
}

export default ItemPopupMenu;
