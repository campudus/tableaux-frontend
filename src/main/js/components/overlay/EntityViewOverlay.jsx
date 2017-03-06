import React, {Component, PropTypes} from "react";
import {openOverlay, closeOverlay, switchEntityViewLanguage} from "../../actions/ActionCreator";
import i18n from "i18next";
import View from "../entityView/RowView";
import {ColumnKinds, ActionTypes, Langtags} from "../../constants/TableauxConstants";
import RowConcatHelper from "../../helpers/RowConcatHelper";
import connectToAmpersand from "../helperComponents/connectToAmpersand";
import focusOnMount from "../helperComponents/focusOnMount";
import Dispatcher from "../../dispatcher/Dispatcher";

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
        <div className="entityView">
        {cells
         .filter(cell => cell.kind !== ColumnKinds.concat)
         .map(
           (cell, idx) => {
             return <View key={cell.id} tabIdx={idx + 1} cell={cell} langtag={langtag} />
           })
        }
      </div>
    );
  }
}

class LanguageSwitcher extends Component {
  static propTypes = {
    langtag: PropTypes.string.isRequired,
  };

  render() {
    return (
        <select className="eev-language-switcher"
                onChange={event => switchEntityViewLanguage({langtag: event.target.value})}
        >
        {Langtags.map(
          langtag => {
            return <option key={langtag} value={langtag}>{langtag}</option>
          }
        )
        }
         </select>
    );
  }
}

export function openEntityView(row, langtag) {
  const firstCell = row.cells.at(0);
  const rowDisplayLabel = RowConcatHelper.getCellAsStringWithFallback(firstCell.value, firstCell.column, langtag);

  const EntityViewFooter = (props) => {
    return (
      <div className="button-wrapper">
        <button className="button neutral" onClick={() => {
          closeOverlay();
        }}>{i18n.t("common:close")}</button>
      </div>
    );
  };

  openOverlay({
    classNames: "entity-view-overlay",
    head: <span>{i18n.t("table:entity_view")}: {rowDisplayLabel} <LanguageSwitcher langtag={langtag} /></span>,
    body: <EntityViewBody row={row} langtag={langtag} />,
    footer: <EntityViewFooter />,
    type: "full-flex"
  });
}
