import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import { Directions, Langtags } from "../../../constants/TableauxConstants";
import classNames from "classnames";
import listensToClickOutside from "react-onclickoutside";
import HeaderPopupMenu from "./HeaderPopupMenu";
import FilterBar from "./FilterBar";
import { getLanguageOrCountryIcon } from "../../../helpers/multiLanguage";
import f from "lodash/fp";
import { unlockRow } from "../../../helpers/annotationHelper";
import Header from "../../overlay/Header";
import HistoryButtons from "../../table/undo/HistoryButtons";
import { retrieveTranslation } from "../../../helpers/multiLanguage";
import { doto, unless } from "../../../helpers/functools";
import { connectOverlayToCellValue } from "../../helperComponents/connectOverlayToCellHOC";
import Empty from "../../../components/helperComponents/emptyEntry";

@listensToClickOutside
class LanguageSwitcher extends PureComponent {
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
    const { open } = this.state;
    this.setOpen(!open)();
  };

  setOpen = open => () => {
    this.setState({ open });
  };

  handleLangtagSwitch = ({ langtag }) => {
    if (this.state.langtag !== langtag) {
      this.props.sharedData.setContentLanguage({ langtag });
    }
  };

  setLang = langtag => () => {
    this.handleLangtagSwitch({ langtag });
    this.setState({ langtag });
    this.setOpen(false)();
  };

  handleClickOutside = () => {
    this.setOpen(false)();
  };

  render() {
    const { open, langtag } = this.state;
    const lswCssClass = classNames("eev-language-switcher", { open: open });
    return (
      <div className="eev-language-switcher-wrapper">
        <div className={lswCssClass} onClick={this.toggleOpen}>
          <div className="eev-label">
            {getLanguageOrCountryIcon(langtag)}
            <i className={open ? "fa fa-angle-up" : "fa fa-angle-down"} />
          </div>
          {open ? (
            <div className="eev-dropdown">
              {Langtags.filter(lt => lt !== langtag).map(lt => {
                return (
                  <div key={lt} className="menu-item">
                    <a href="#" onClick={this.setLang(lt)}>
                      {getLanguageOrCountryIcon(lt, "language")}
                    </a>
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>
    );
  }
}

class RowSwitcher extends PureComponent {
  static propTypes = {
    rows: PropTypes.array,
    row: PropTypes.object.isRequired,
    id: PropTypes.number.isRequired,
    langtag: PropTypes.string.isRequired
  };

  changeEntityViewRow = row => {
    const { id, actions } = this.props;
    actions.setOverlayState({ id, row });
  };

  getNextRow = dir => {
    const { row, rows } = this.props;
    const myRowIdx = f.findIndex(f.matchesProperty("id", row.id), rows);
    const dirAsNumber = dir === Directions.UP ? -1 : 1;
    return f.get([myRowIdx + dirAsNumber], rows);
  };

  switchRow = dir => () => {
    const nextRow = this.getNextRow(dir);
    if (nextRow) {
      unlockRow({}, false);
      this.props.updateSharedData(f.assoc("row", nextRow));
      this.changeEntityViewRow(nextRow);
    }
  };

  render() {
    return (
      <div className="row-switcher">
        {this.getNextRow(Directions.UP) ? (
          <div
            className="button clickable"
            onClick={this.switchRow(Directions.UP)}
          >
            <a href="#">
              <i className="fa fa-angle-left" />
            </a>
          </div>
        ) : (
          <div className="button dummy" />
        )}
        {this.getNextRow(Directions.DOWN) ? (
          <div
            className="button clickable"
            onClick={this.switchRow(Directions.DOWN)}
          >
            <a href="#">
              <i className="fa fa-angle-right" />
            </a>
          </div>
        ) : (
          <div className="button dummy" />
        )}
      </div>
    );
  }
}

@connectOverlayToCellValue
class EntityViewHeader extends PureComponent {
  static propTypes = {
    canSwitchRows: PropTypes.bool,
    hasMeaningfulLinks: PropTypes.any,
    row: PropTypes.object.isRequired,
    langtag: PropTypes.string.isRequired
  };

  render() {
    const {
      id,
      actions,
      canSwitchRows,
      hasMeaningfulLinks,
      sharedData,
      langtag,
      row,
      rows,
      grudData,
      cell
    } = this.props;
    const tableId = f.prop(["table", "id"], cell);
    const table = f.prop(["tables", "data", tableId], grudData);
    const { tableView } = grudData;

    const components = (
      <div className="header-components">
        <LanguageSwitcher langtag={langtag} />
        {canSwitchRows && !f.isEmpty(rows) ? (
          <RowSwitcher {...this.props} />
        ) : null}
        <HistoryButtons
          tableView={tableView}
          tableId={tableId}
          rowId={row.id}
          actions={actions}
        />
        <FilterBar id={id} />
        <HeaderPopupMenu
          tableView={tableView}
          langtag={langtag}
          id={id}
          funcs={sharedData}
          hasMeaningfulLinks={hasMeaningfulLinks}
        />
      </div>
    );
    const tableName = f.isEmpty(table.displayName)
      ? table.name
      : retrieveTranslation(langtag, table.displayName) || table.name;

    const displayValue = doto(
      grudData,
      f.prop(["displayValues", table.id]),
      f.find(f.propEq("id", row.id)),
      f.prop("values"),
      f.propOr({}, 0)
    );
    const title = doto(
      displayValue,
      retrieveTranslation(langtag),
      f.defaultTo(<Empty langtag={langtag} />)
    );

    return (
      <Header
        {...this.props}
        cell={{ ...cell, displayValue }}
        context={tableName}
        components={components}
        title={title}
      />
    );
  }
}

const getDisplayLabel = (row, langtag) => {
  const firstCell = f.prop(["values", 0], row);
  return unless(f.isEmpty, retrieveTranslation(langtag))(
    f.prop("displayValue", firstCell)
  );
};

export { getDisplayLabel };
export default EntityViewHeader;
