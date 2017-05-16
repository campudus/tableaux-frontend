import React, {Component, PropTypes} from "react";
import {ActionTypes, Directions, FallbackLanguage, Langtags} from "../../../constants/TableauxConstants";
import classNames from "classnames";
import listensToClickOutside from "react-onclickoutside";
import HeaderPopupMenu from "./HeaderPopupMenu";
import FilterBar from "./FilterBar";
import {getLanguageOrCountryIcon} from "../../../helpers/multiLanguage";
import RowConcatHelper from "../../../helpers/RowConcatHelper";
import * as f from "lodash/fp";
import {changeEntityViewRow, changeHeaderTitle, switchEntityViewLanguage} from "../../../actions/ActionCreator";
import Dispatcher from "../../../dispatcher/Dispatcher";

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

  componentDidMount() {
    Dispatcher.on(ActionTypes.SWITCH_ENTITY_VIEW_LANGUAGE, this.handleLangtagSwitch);
  }

  componentWillUnmount() {
    Dispatcher.off(ActionTypes.SWITCH_ENTITY_VIEW_LANGUAGE, this.handleLangtagSwitch);
  }

  toggleOpen = () => {
    const {open} = this.state;
    this.setOpen(!open)();
  };

  setOpen = open => () => {
    this.setState({open});
  };

  handleLangtagSwitch = ({langtag}) => {
    if (this.state.langtag !== langtag) {
      this.setState({langtag});
    }
  };

  setLang = langtag => () => {
    this.setState({langtag}, () => switchEntityViewLanguage({langtag}));
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
          {getLanguageOrCountryIcon(langtag)}
          <i className={(open) ? "fa fa-angle-up" : "fa fa-angle-down"} />
        </div>
        {(open)
          ? (
            <div className="eev-dropdown">
              {Langtags.map(
                lt => {
                  const cssClass = classNames("menu-item", {"active": lt === langtag});
                  return <div key={lt} className={cssClass}>
                    <a href="#" onClick={this.setLang(lt)}>{getLanguageOrCountryIcon(lt)}</a>
                  </div>;
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

class RowSwitcher extends Component {
  static propTypes = {
    row: PropTypes.object.isRequired,
    id: PropTypes.number.isRequired,
    langtag: PropTypes.string.isRequired
  };

  constructor(props) {
    super(props);
    this.state = {row: props.row};
  }

  getNextRow = dir => {
    const {row} = this.state;
    const rowsCollection = f.get(["collection", "models"], row);
    const myRowIdx = f.findIndex(f.matchesProperty("id", row.id), rowsCollection);
    const dirAsNumber = (dir === Directions.UP) ? -1 : 1;
    return f.get([myRowIdx + dirAsNumber], rowsCollection);
  };

  switchRow = dir => () => {
    const nextRow = this.getNextRow(dir);
    if (nextRow) {
      this.setState({row: nextRow});
      changeEntityViewRow({
        id: this.props.id,
        row: nextRow
      });
      changeHeaderTitle({
        id: this.props.id,
        title: getDisplayLabel(nextRow, this.props.langtag)
      });
    }
  };

  render() {
    return (
      <div className="row-switcher">
        {(this.getNextRow(Directions.UP))
          ? (
            <div className="button" onClick={this.switchRow(Directions.UP)}>
              <a href="#">
                <i className="fa fa-angle-left" />
              </a>
            </div>
          )
          : null
        }
        {(this.getNextRow(Directions.DOWN))
          ? (
            <div className="button" onClick={this.switchRow(Directions.DOWN)}>
              <a href="#">
                <i className="fa fa-angle-right" />
              </a>
            </div>
          )
          : null
        }
      </div>
    );
  }
}

const mkHeaderComponents = (id, row, langtag, {canSwitchRows} = {}) => {
  return (
    <div className="header-components">
      <div className="top-right">
        <LanguageSwitcher langtag={langtag} />
        {(canSwitchRows) ? <RowSwitcher row={row} id={id} langtag={langtag} /> : null}
      </div>
      <div className="search-and-popup">
        <FilterBar id={id} />
        <HeaderPopupMenu langtag={langtag} row={row} id={id} />
      </div>
    </div>
  );
};

const getTableName = (row, langtag) => {
  const firstCell = row.cells.at(0);
  const table = firstCell.tables.get(firstCell.tableId);
  return f.prop(["displayName", langtag], table) || f.prop(["displayName", FallbackLanguage], table);
};

const getDisplayLabel = (row, langtag) => {
  const firstCell = row.cells.at(0);
  return RowConcatHelper.getCellAsStringWithFallback(firstCell.value, firstCell.column, langtag);
};

export {getTableName, getDisplayLabel};
export default mkHeaderComponents;
