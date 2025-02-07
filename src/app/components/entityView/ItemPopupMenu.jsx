import classNames from "classnames";
import i18n from "i18next";
import f from "lodash/fp";
import PropTypes from "prop-types";
import React, { Component } from "react";
import ReactDOM from "react-dom";
import listenToClickOutside from "react-onclickoutside";
import pasteCellValue from "../../components/cells/cellCopyHelper";
import { ColumnKinds } from "../../constants/TableauxConstants";
import { canConvert } from "../../helpers/cellValueConverter";
import actions from "../../redux/actionCreators";
import store from "../../redux/store";
import SvgIcon from "../helperComponents/SvgIcon";
import { openShowDependency } from "../overlay/ConfirmDependentOverlay";
import { clearSelectedCellValue } from "../../redux/actions/cellActions";
import AnnotationContextMenu from "../contextMenu/AnnotationContextMenu";

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

  mkEntry = (_, { title, fn, value, icon, classes }) => {
    const clickHandler = f.flow(
      e => {
        e.stopPropagation();
      },
      fn,
      this.closePopup
    );
    return (
      <button className="entry" onClick={clickHandler}>
        <i className={classes || `fa fa-${icon}`} />
        <div>{value ? i18n.t(title, { langtag: value }) : i18n.t(title)}</div>
      </button>
    );
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
        <button
          className={buttonClass}
          onMouseLeave={leaveItemPopupButton}
          onMouseDown={popupOpen ? f.noop : this.props.funcs.openItemPopup}
        >
          <SvgIcon icon="vdots" />
        </button>
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
            {cell.kind !== ColumnKinds.status &&
              this.mkEntry(1, {
                title: "table:copy_cell",
                fn: () =>
                  store.dispatch(actions.copyCellValue({ cell, langtag })),
                icon: "files-o"
              })}
            {thisUserCantEdit
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
            {thisUserCantEdit || cell.column.kind === ColumnKinds.group
              ? null
              : this.mkEntry(3, {
                  title: "table:clear-cell.title",
                  fn: () => {
                    clearSelectedCellValue(cell, langtag);
                  },
                  icon: "times"
                })}
            {
              <a className="entry annotation-context-menu-button">
                <SvgIcon icon="highlight" />
                <div>{i18n.t("table:show-annotations")}</div>
                <i className="fa fa-chevron-right" />
                <AnnotationContextMenu
                  classNames="light"
                  cell={cell}
                  langtag={this.props.langtag}
                  closeAction={this.closePopup}
                />
              </a>
            }
            {cell.column.multilanguage &&
              canConvert(cell.kind, ColumnKinds.text) &&
              this.mkEntry(5, {
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
          </MenuPopup>
        ) : null}
      </div>
    );
  }
}

export default ItemPopupMenu;
