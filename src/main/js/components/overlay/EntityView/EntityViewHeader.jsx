import React, {Component, PropTypes} from "react";
import {switchEntityViewLanguage} from "../../../actions/ActionCreator";
import {FallbackLanguage, Langtags} from "../../../constants/TableauxConstants";
import classNames from "classnames";
import listensToClickOutside from "react-onclickoutside";
import HeaderPopupMenu from "./HeaderPopupMenu";
import FilterBar from "./FilterBar";
import {getLanguageOrCountryIcon} from "../../../helpers/multiLanguage";
import RowConcatHelper from "../../../helpers/RowConcatHelper";
import * as f from "lodash/fp";

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

const mkHeaderComponents = (id, row, langtag) => {
  return (
    <div className="header-components">
      <LanguageSwitcher langtag={langtag} />
      <div className="search-and-popup">
        <FilterBar id={id} />
        <HeaderPopupMenu langtag={langtag} row={row} id={id} />
      </div>
    </div>
  )
};

const getTableName = (row, langtag) => {
  const firstCell = row.cells.at(0);
  const rowDisplayLabel = RowConcatHelper.getCellAsStringWithFallback(firstCell.value, firstCell.column, langtag);
  const table = firstCell.tables.get(firstCell.tableId);
  return f.prop(["displayName", langtag], table) || f.prop(["displayName", FallbackLanguage], table);
};

const getDisplayLabel = (row, langtag) => {
  const firstCell = row.cells.at(0);
  return RowConcatHelper.getCellAsStringWithFallback(firstCell.value, firstCell.column, langtag);
};

export {getTableName, getDisplayLabel};
export default mkHeaderComponents;