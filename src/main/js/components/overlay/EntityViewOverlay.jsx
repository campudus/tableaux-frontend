import React, {Component, PropTypes} from "react";
import {openOverlay, closeOverlay, switchEntityViewLanguage} from "../../actions/ActionCreator";
import i18n from "i18next";
import View from "../entityView/RowView";
import {ColumnKinds, ActionTypes, Langtags} from "../../constants/TableauxConstants";
import RowConcatHelper from "../../helpers/RowConcatHelper";
import Dispatcher from "../../dispatcher/Dispatcher";
import classNames from "classnames";
import listensToClickOutside from "react-onclickoutside";
import {first, matchesPropery, prop} from "lodash/fp";
import zenscroll from "zenscroll";
import Header from "./Header";
import {FallbackLanguage} from "../../constants/TableauxConstants";

class EntityViewBody extends Component {
  constructor(props) {
    super(props);
    this.state = {langtag: props.langtag};
  }

  static PropTypes = {
    langtag: PropTypes.string.isRequired,
    row: PropTypes.object.isRequired
  };

  componentWillMount = () => {
    Dispatcher.on(ActionTypes.SWITCH_ENTITY_VIEW_LANGUAGE, this.switchLang);
  };

  componentDidMount() {
    const {focusElementId, row} = this.props;
    if (focusElementId) {
      const cell = row.cells.get(focusElementId);
      if (cell.kind === ColumnKinds.concat) {
        return; // concat elements are omitted from EntityView
      }
      const container = first(document.getElementsByClassName("content-scroll"));
      const viewId = `view-${cell.column.id}-${cell.rowId}`;
      const element = first(document.getElementsByClassName(viewId));
      const scroller = zenscroll.createScroller(container);
      console.log("tn", container, "c", cell, "id", viewId, "el", element, "scr", scroller);
      scroller.to(element, 1);
    }
  }

  componentWillUnmount = () => {
    Dispatcher.off(ActionTypes.SWITCH_ENTITY_VIEW_LANGUAGE, this.switchLang);
  };

  switchLang = ({langtag}) => {
    this.setState({langtag});
  };

  render() {
    const cells = this.props.row.cells.models;
    const {langtag} = this.state;

    return (
        <div className="entity-view content-items">
        {cells
         .filter(cell => cell.kind !== ColumnKinds.concat)
         .map(
           (cell, idx) => {
             return <View key={cell.id} tabIdx={idx + 1} cell={cell} langtag={langtag} />;
           })
        }
      </div>
    );
  }
}

@listensToClickOutside
class LanguageSwitcher extends Component {
  static propTypes = {
    langtag: PropTypes.string.isRequired
  };

  constructor(props) {
    super(props);
    this.state = {
      open: false,
      langtag: props.langtag
    };
  }

  toggleOpen = () => {
    const {open} = this.state;
    this.setOpen(!open)();
  };

  setOpen = open => () => {
    this.setState({open});
  };

  setLang = langtag => () => {
    switchEntityViewLanguage({langtag});
    this.setState({langtag});
    this.setOpen(false);
  };

  handleClickOutside = () => {
    this.setOpen(false)();
  };

  render() {
    const {open, langtag} = this.state;
    const lswCssClass = classNames("eev-language-switcher", {"open": open});
    return (
        <div className={lswCssClass} onClick={this.toggleOpen}>
        <div className="eev-label">
        {langtag}
      </div>
      {(open)
       ? (
           <div className="eev-dropdown">
           {Langtags.map(
             lt => {
               const cssClass = classNames("menu-item", {"active": lt === langtag});
               return <div key={lt} className={cssClass}><a href="#" onClick={this.setLang(lt)}><i>{lt}</i></a></div>;
             }
           )}
         </div>
       )
       : null
      }
      </div>
    );
  }
}

export function openEntityView(row, langtag, focusElementId) {
  const firstCell = row.cells.at(0);
  const rowDisplayLabel = RowConcatHelper.getCellAsStringWithFallback(firstCell.value, firstCell.column, langtag);
  const table = firstCell.tables.get(firstCell.tableId);
  const tableName = prop(["displayName", langtag], table) || prop(["displayName", FallbackLanguage], table);

  openOverlay({
    head: <Header context={tableName} title={rowDisplayLabel} components={<LanguageSwitcher langtag={langtag} />} />,
    body: <EntityViewBody row={row} langtag={langtag} focusElementId={focusElementId} />,
    type: "full-height"
  });
}
