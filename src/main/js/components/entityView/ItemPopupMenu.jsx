import React, {Component, PropTypes} from "react";
import listenToClickOutside from "react-onclickoutside";
import classNames from "classnames";
import i18n from "i18next";
import ActionCreator from "../../actions/ActionCreator";
import * as f from "lodash/fp";
import {ColumnKinds, Langtags} from "../../constants/TableauxConstants";
import {addTranslationNeeded, removeTranslationNeeded} from "../../helpers/annotationHelper";
import {openShowDependency} from "../overlay/ConfirmDependentOverlay";
import {canConvert} from "../../helpers/cellValueConverter";

const CLOSING_TIMEOUT = 300; // ms; time to close popup after mouse left

@listenToClickOutside
class ItemPopupMenu extends Component {
  static propTypes = {
    langtag: PropTypes.string.isRequired,
    cell: PropTypes.object.isRequired,
    setTranslationView: PropTypes.func.isRequired
  };

  constructor(props) {
    super(props);
    this.state = {
      open: false,
      active: null
    };
  }

  handleClickOutside = () => {
    this.setState({open: false});
  };

  mkEntry = (idx, {title, fn, value}) => {
    const entryClass = classNames("entry", {"active": this.state.active === idx});
    const clickHandler = f.compose(
      () => this.setState({open: false}),
      fn
    );
    return (
      <div className={entryClass} onMouseEnter={() => this.setState({active: idx})}>
        <a href="#" onClick={clickHandler}>
          {(value) ? i18n.t(title, {langtag: value}) : i18n.t(title)}
        </a>
      </div>
    )
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
    )
  };

  mkAddTranslationEntry = () => {
    const {cell, langtag} = this.props;
    if (f.contains(langtag, f.prop(["annotations", "translationNeeded", "langtags"]))) {
      return null;
    }
    const neededTranslation = (this.isPrimaryLanguage())
      ? f.drop(1, Langtags)
      : f.merge(f.prop(["annotation", "needsTranslation", "langtag"], cell), langtag);
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
      ? () => deleteAnnotation(f.merge(cellTranslationAnnotation,
        {
          type: "flag",
          value: "translationNeeded"
        }), cell)
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

  startClosingTimer = () => {
    this.cancelClosingTimer();
    this.timeoutId = window.setTimeout(() => this.setState({open: false}), CLOSING_TIMEOUT);
  };

  cancelClosingTimer = () => {
    if (!f.isNil(this.timeoutId)) {
      window.clearTimeout(this.timeoutId);
      delete this.timeoutId;
    }
  };

  handleMouseLeave = () => {
    if (this.state.open) {
      this.startClosingTimer();
    }
  };

  render() {
    const {open} = this.state;
    const {cell: {row}, cell, langtag} = this.props;
    const buttonClass = classNames("popup-button", {
      "is-open": open
    });
    return (
      <div className="entry-popup-wrapper">
        <div className={buttonClass}
             onMouseEnter={this.cancelClosingTimer}
             onMouseLeave={this.handleMouseLeave}
        >
          <a href="#" onClick={() => this.setState({open: !open})}>
            <i className="fa fa-ellipsis-v" />
          </a>
        </div>
        {(open)
          ? (
            <div className="entry-popup"
                 onMouseEnter={this.cancelClosingTimer}
                 onMouseLeave={this.startClosingTimer}
            >
              <div className="separator">
                {"title"}
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
              {this.mkEntry(2,
                {
                  title: "table:paste_cell",
                  fn: () => ActionCreator.pasteCellContent(cell, langtag)
                })}

              {(cell.isMultiLanguage && canConvert(cell.kind, ColumnKinds.text))
                ? (
                  <div>
                    <div className="separator">
                      {"title2"}
                    </div>
                    {this.mkAddTranslationEntry()}
                    {this.mkRemoveTranslationEntry()}
                    {this.mkEntry(5,
                      {
                        title: "table:show_translation",
                        fn: () => this.props.setTranslationView({
                          show: true,
                          cell
                        })
                      })
                    }
                  </div>
                )
                : null
              }
            </div>
          )
          : null
        }
      </div>
    )
  }
}

export default ItemPopupMenu;