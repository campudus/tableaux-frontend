import React, {Component, PropTypes} from "react";
import ActionCreator from "../../../actions/ActionCreator";
import i18n from "i18next";
import classNames from "classnames";
import * as f from "lodash/fp";
import {openShowDependency} from "../ConfirmDependentOverlay";
import {maybe} from "../../../helpers/monads";
import {initiateDeleteRow, initiateDuplicateRow} from "../../../helpers/rowHelper";
import {setRowAnnotation} from "../../../helpers/annotationHelper";
import listenToClickOutside from "react-onclickoutside";
import SvgIcon from "../../helperComponents/SvgIcon";
import Dispatcher from "../../../dispatcher/Dispatcher";
import {ActionTypes} from "../../../constants/TableauxConstants";

const CLOSING_TIMEOUT = 300; // ms; time to close popup after mouse left

@listenToClickOutside
class HeaderPopupMenu extends Component {
  static propTypes = {
    langtag: PropTypes.string.isRequired,
    row: PropTypes.object.isRequired
  };

  constructor(props) {
    super(props);
    this.state = {
      open: false,
      active: null,
      row: props.row
    };
  }

  componentDidMount() {
    Dispatcher.on(ActionTypes.CHANGE_ENTITY_VIEW_ROW, this.changeRow);
  }

  componentWillUnmount() {
    Dispatcher.off(ActionTypes.CHANGE_ENTITY_VIEW_ROW, this.changeRow);
  }

  changeRow = ({row, id}) => {
    if (this.props.id === id) {
      this.setState({row});
    }
  };

  mkEntry = (id, {title, fn}) => {
    const entryClass = classNames("entry", {"active": id === this.state.active});
    const clickHandler = f.compose(
      () => console.log("Clicked", title),
      () => this.setState({open: false}),
      fn
    );
    return (
      <div className={entryClass}
           onMouseEnter={() => this.setState({active: id})}
           onClick={clickHandler}
      >
        <a href="#">
          {i18n.t(title)}
        </a>
      </div>
    );
  };

  handleClickOutside = () => {
    this.setState({open: false});
  };

  componentWillUnmount = () => {
    this.cancelClosingTimer();
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
    const {langtag} = this.props;
    const {open, row} = this.state;
    const buttonClass = classNames("popup-button", {"is-open": open});
    const translationInfo = {
      show: true,
      cell: maybe(row.cells).exec("at", 0).getOrElse(null)
    };

    return (
      <div className="header-popup-wrapper">
        <div className={buttonClass}
             onMouseEnter={() => {
               this.setState({open: true});
               this.cancelClosingTimer();
             }}
             onMouseLeave={this.handleMouseLeave}
        >
          <a href="#" onClick={event => {
            event.stopPropagation();
            this.setState({open: !open});
          }}>
            <SvgIcon icon="vdots" containerClasses="color-white" />
          </a>
        </div>
        {(open)
          ? (
            <div className="popup-wrapper">
              <div className="popup" onMouseLeave={this.handleMouseLeave} onMouseEnter={this.cancelClosingTimer}>
                <div className="separator">{i18n.t("table:menus.information")}</div>
                {this.mkEntry(0,
                  {
                    title: "table:show_dependency",
                    fn: () => openShowDependency(row, langtag)
                  })}
                {this.mkEntry(1,
                  {
                    title: "table:show_translation",
                    fn: () => ActionCreator.setTranslationView(translationInfo)
                  })}
                <div className="separator">{i18n.t("table:menus.edit")}</div>
                {this.mkEntry(2,
                  {
                    title: "table:delete_row",
                    fn: () => initiateDeleteRow(row, langtag)
                  })}
                {this.mkEntry(3,
                  {
                    title: "table:duplicate_row",
                    fn: () => initiateDuplicateRow(row, langtag)
                  })}
                {this.mkEntry(4,
                  {
                    title: (row.final) ? "table:final.set_not_final" : "table:final.set_final",
                    fn: () => setRowAnnotation({final: !row.final}, row)
                  })}
              </div>
            </div>
          )
          : null
        }
      </div>
    )
  }
}

export default HeaderPopupMenu;