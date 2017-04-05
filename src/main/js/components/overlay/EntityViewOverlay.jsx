import React, {Component, PropTypes} from "react";
import {broadcastRowLoaded, openOverlay, switchEntityViewLanguage} from "../../actions/ActionCreator";
import View from "../entityView/RowView";
import {ActionTypes, ColumnKinds, FallbackLanguage, Langtags} from "../../constants/TableauxConstants";
import RowConcatHelper from "../../helpers/RowConcatHelper";
import Dispatcher from "../../dispatcher/Dispatcher";
import classNames from "classnames";
import listensToClickOutside from "react-onclickoutside";
import {first, prop} from "lodash/fp";
import zenscroll from "zenscroll";
import Header from "./Header";
import {showDialog} from "./GenericOverlay";
import {maybe} from "../../helpers/monads";
import i18n from "i18next";

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
//      console.log("tn", container, "c", cell, "id", viewId, "el", element, "scr", scroller);
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
                  return <div key={lt} className={cssClass}><a href="#" onClick={this.setLang(lt)}><i>{lt}</i></a>
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

class EntityViewHeaderWrapper extends Component {
  static propTypes = {
    row: PropTypes.object,
    overlayId: PropTypes.number.isRequired,
    langtag: PropTypes.string.isRequired,
  };

  constructor(props) {
    super(props);
    this.state = {row: props.row || null};
  }

  componentWillMount = () => {
    Dispatcher.on(ActionTypes.ENTITY_VIEW_ROW_LOADED, this.handleRowLoaded);
  };

  componentWillUnmount = () => {
    Dispatcher.off(ActionTypes.ENTITY_VIEW_ROW_LOADED, this.handleRowLoaded);
  };

  handleRowLoaded = ({overlayId, row}) => {
    if (this.props.overlayId === overlayId) {
      this.setState({row});
    }
  };

  render() {
    const {langtag} = this.props;
    const {row} = this.state;
    const elements = (row)
      ? {
        context: getTableName(row, langtag),
        title: getDisplayLabel(row, langtag),
        components: <div></div>,
        langtag
      }
      : {
        context: "",
        title: i18n.t("table:loading"),
        components: <div></div>,
        langtag
      };
    return <Header {...elements} />
  }
}

class EntityViewBodyWrapper extends Component {
  static propTypes = {
    overlayId: PropTypes.number.isRequired,
    toLoad: PropTypes.object,
    row: PropTypes.object,
    langtag: PropTypes.string.isRequired,
    focusElementId: PropTypes.any
  };

  constructor(props) {
    super(props);
    const {toLoad, row} = props;
    if ((!!toLoad ^ !!row) !== 1) {
      console.error("EntityView: Need to specify either a row to load or a loaded row");
    }

    if (toLoad) {
      const setLoadedRow = row => {
        this.setState({row});
        broadcastRowLoaded({
          overlayId: this.props.overlayId,
          row
        })
      };
      this.state = {
        row: null,
        pages: 1,
        fetched: 0
      };
      this.loadRow(toLoad)
          .then(setLoadedRow)
          .catch(
            error => {
              console.error(error);
              showDialog({
                type: "warning",
                context: "Error",
                title: "Could not load row",
                heading: "An error occured while fetching row from database",
                message: error.toString(),
                actions: {neutral: ["Ok", null]}
              });
            });
    } else {
      this.state = {row: props.row};
    }
  }

  loadRow = ({table, tables, tableId, rowId}) => {
    const targetTable = maybe(tables)
      .exec("get", tableId)
      .getOrElse(table);

    const isRowFullyLoaded = row => row && row.cells && row.columns && row.cells.length === row.columns.length;

    const loadColumns = () => new Promise(
      (resolve, reject) => {
        const tableMonad = maybe(targetTable)
          .map(prop("columns"))
          .exec("fetch", {
            reset: true,
            success: () => {
              this.setState({pages: targetTable.rows.pageCount()});
              resolve();
            },
            error: e => {
              reject("Error initialising table columns:", e)
            }
          });
        if (tableMonad.isNone) {
          reject("No table to load row from");
        }
      }
    );

    const loadPages = () => new Promise(
      (resolve, reject) => {
        const loadPage = (pageNum) => {
          console.log("Loading page", pageNum, "of", this.state.pages);
          const requestedRow = targetTable.rows.get(rowId);
          if (pageNum > targetTable.rows.pageCount() || isRowFullyLoaded(requestedRow)) {
            resolve(requestedRow || null);
          } else {
            targetTable.rows.fetchPage(pageNum, {
              reset: pageNum === 1,
              success: () => {
                this.setState({fetched: pageNum});
                loadPage(pageNum + 1)
              },
              error: () => reject("Could not load page number" + pageNum)
            });
          }
        };
        loadPage(1);
      });

    return new Promise(
      (resolve, reject) => {
        const cachedRow = maybe(targetTable.rows.get(rowId))
          .exec("get", rowId);
        if (cachedRow.isJust && isRowFullyLoaded(cachedRow.value)) {
          console.log("Using already cached row");
          resolve(cachedRow.value);
        } else {
          loadColumns()
            .then(loadPages)
            .then(result => (result) ? resolve(result) : reject("Could not load desired row"))
            .catch(console.error)
        }
      }
    );
  };

  render() {
    const {row} = this.state;
    if (row) {
      return <EntityViewBody row={row} langtag={this.props.langtag} />
    } else {
      const {pages, fetched} = this.state;
      const percentageLoaded = 100.0 * fetched / (pages || 1);
      const barStyle = {
        height: "5px",
        transition: "width 0.3s",
        width: `${percentageLoaded}%`,
        margin: 0,
        backgroundColor: "#3296DC"
      }
      return <div className="loading-bar" style={barStyle}></div>
    }
  }
}

const getTableName = (row, langtag) => {
  const firstCell = row.cells.at(0);
  const rowDisplayLabel = RowConcatHelper.getCellAsStringWithFallback(firstCell.value, firstCell.column, langtag);
  const table = firstCell.tables.get(firstCell.tableId);
  return prop(["displayName", langtag], table) || prop(["displayName", FallbackLanguage], table);
};

const getDisplayLabel = (row, langtag) => {
  const firstCell = row.cells.at(0);
  return RowConcatHelper.getCellAsStringWithFallback(firstCell.value, firstCell.column, langtag);
};

export function openEntityView(row, langtag, focusElementId) {
  const rowDisplayLabel = getDisplayLabel(row, langtag);
  const tableName = getTableName(row, langtag);
  openOverlay({
    head: <Header context={tableName} title={rowDisplayLabel} components={<LanguageSwitcher langtag={langtag} />} />,
    body: <EntityViewBody row={row} langtag={langtag} focusElementId={focusElementId} />,
    type: "full-height"
  });
}

// target: {(tables: Tables, tableId: int > 0, | table: Table) rowId: int > 0}
export function loadAndOpenEntityView(target, langtag) {
  const overlayId = new Date().getTime();
  openOverlay({
    head: <EntityViewHeaderWrapper overlayId={overlayId} langtag={langtag} />,
    body: <EntityViewBodyWrapper overlayId={overlayId} langtag={langtag} toLoad={target} />,
    type: "full-height"
  })
}