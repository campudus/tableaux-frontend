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
import { doto } from "../../../helpers/functools";
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

  componentDidMount() {
    // Dispatcher.on(ActionTypes.SWITCH_ENTITY_VIEW_LANGUAGE, this.handleLangtagSwitch);
  }

  componentWillUnmount() {
    // Dispatcher.off(ActionTypes.SWITCH_ENTITY_VIEW_LANGUAGE, this.handleLangtagSwitch);
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
      this.setState({ langtag });
    }
  };

  setLang = langtag => () => {
    // this.setState({langtag}, () => switchEntityViewLanguage({langtag}));
    this.setOpen(false);
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

  updateHeader = ({ cell }) => {
    this.forceUpdate();
  };

  render() {
    const {
      canSwitchRows,
      hasMeaningfulLinks,
      langtag,
      table,
      row,
      rows,
      grudData
    } = this.props;

    const components = (
      <div className="header-components">
        <LanguageSwitcher langtag={langtag} />
        {canSwitchRows && !f.isEmpty(rows) ? (
          <RowSwitcher {...this.props} />
        ) : null}
        <HistoryButtons tableId={table.id} rowId={row.id} />
        <FilterBar id={this.props.id} />
        <HeaderPopupMenu
          langtag={langtag}
          row={row}
          id={this.props.id}
          hasMeaningfulLinks={hasMeaningfulLinks}
        />
      </div>
    );
    const tableName = f.isEmpty(table.displayName)
      ? table.name
      : retrieveTranslation(langtag, table.displayName) || table.name;

    const title = doto(
      grudData,
      f.prop(["displayValues", table.id]),
      f.find(f.propEq("id", row.id)),
      f.prop("values"),
      f.propOr({}, 0),
      retrieveTranslation(langtag),
      f.defaultTo(<Empty langtag={langtag} />)
    );

    return (
      <Header
        {...this.props}
        context={tableName}
        components={components}
        title={title}
      />
    );
  }
}

const getDisplayLabel = (row, langtag) => {
  const firstCell = row.cells.at(0);
  return firstCell.displayValue[langtag];
};

export { getDisplayLabel };
export default EntityViewHeader;
