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
import {unlockRow} from "../../../helpers/annotationHelper";
import Header from "../../overlay/Header";
import i18n from "i18next";

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
      <div className="eev-language-switcher-wrapper">
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
    const firstCell = row.cells.at(0);
    const table = firstCell.tables.get(firstCell.tableId);
    const rowsCollection = f.get("models", this.props.rows || table.rows);
    const myRowIdx = f.findIndex(f.matchesProperty("id", row.id), rowsCollection);
    const dirAsNumber = (dir === Directions.UP) ? -1 : 1;
    return f.get([myRowIdx + dirAsNumber], rowsCollection);
  };

  switchRow = dir => () => {
    const nextRow = this.getNextRow(dir);
    if (nextRow) {
      unlockRow({}, false);
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
            <div className="button clickable" onClick={this.switchRow(Directions.UP)}>
              <a href="#">
                <i className="fa fa-angle-left" />
              </a>
            </div>
          )
          : <div className="button dummy"/>
        }
        {(this.getNextRow(Directions.DOWN))
          ? (
            <div className="button clickable" onClick={this.switchRow(Directions.DOWN)}>
              <a href="#">
                <i className="fa fa-angle-right" />
              </a>
            </div>
          )
          : <div className="button dummy" />
        }
      </div>
    );
  }
}

const EntityViewHeader = props => {
  const {canSwitchRows, hasMeaningfulLinks, row, langtag} = props;
  const rowDisplayLabel = getDisplayLabel(row, langtag);

  const title = rowDisplayLabel === RowConcatHelper.NOVALUE
    ? <span className="empty-item">({i18n.t("common:empty")})</span>
    : rowDisplayLabel;

  const tableName = getTableName(row, langtag);
  const components = (
    <div className="header-components">
      <LanguageSwitcher langtag={props.langtag} />
      {(canSwitchRows) ? <RowSwitcher {...props} /> : null}
      <FilterBar id={props.id} />
      <HeaderPopupMenu langtag={props.langtag} row={props.row} id={props.id} hasMeaningfulLinks={hasMeaningfulLinks} />
    </div>
  );
  return <Header {...props} context={tableName} title={title} components={components} />;
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
export default EntityViewHeader;
