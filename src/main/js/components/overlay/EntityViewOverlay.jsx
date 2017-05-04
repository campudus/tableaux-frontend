import React, {Component, PropTypes} from "react";
import {broadcastRowLoaded, openOverlay, switchEntityViewLanguage} from "../../actions/ActionCreator";
import View from "../entityView/RowView";
import {
  ActionTypes,
  ColumnKinds,
  Directions,
  FallbackLanguage,
  FilterModes,
  Langtags
} from "../../constants/TableauxConstants";
import RowConcatHelper from "../../helpers/RowConcatHelper";
import Dispatcher from "../../dispatcher/Dispatcher";
import classNames from "classnames";
import listensToClickOutside from "react-onclickoutside";
import zenscroll from "zenscroll";
import Header from "./Header";
import {showDialog} from "./GenericOverlay";
import {maybe} from "../../helpers/monads";
import i18n from "i18next";
import TranslationPopup from "../entityView/TranslationPopup";
import * as f from "lodash/fp";
import HeaderPopupMenu from "../entityView/HeaderPopupMenu";
import FilterBar from "../entityView/FilterBar";
import columnFilter from "../entityView/columnFilter";
import {getLanguageOrCountryIcon} from "../../helpers/multiLanguage";
import KeyboardShortcutsHelper from "../../helpers/KeyboardShortcutsHelper";

@listensToClickOutside
class EntityViewBody extends Component {
  constructor(props) {
    super(props);
    this.state = {
      langtag: props.langtag,
      translationView: false,
      filter: {
        value: "",
        mode: FilterModes.CONTAINS
      },
      focused: null,
    };
    this.focusElements = {};
    this.translationItem = null;
    props.registerForEvent({
      type: "scroll",
      handler: () => this.setTranslationItem()
    });
  }

  static PropTypes = {
    langtag: PropTypes.string.isRequired,
    row: PropTypes.object.isRequired,
    id: PropTypes.number.isRequired,
    registerForEvent: PropTypes.func.isRequired
  };

  getKeyboardShortcuts = () => {
    return {
      escape: event => {
        this.setTranslationView({show: false});
      },
      tab: event => {
        event.preventDefault();
        event.stopPropagation();
        const dir = (event.shiftKey) ? Directions.UP : Directions.DOWN;
        this.changeFocus(dir);
      }
    }
  };

  handleClickOutside() {
    this.setTranslationView({show: false});
  }

  componentWillMount = () => {
    Dispatcher.on(ActionTypes.SWITCH_ENTITY_VIEW_LANGUAGE, this.switchLang);
    Dispatcher.on(ActionTypes.SET_TRANSLATION_VIEW, this.setTranslationView);
    Dispatcher.on(ActionTypes.FILTER_ENTITY_VIEW, this.setColumnFilter);
  };

  componentDidMount() {
    const {focusElementId, row} = this.props;
    if (focusElementId) {
      const cell = row.cells.get(focusElementId);
      if (cell.kind === ColumnKinds.concat) {
        return; // concat elements are omitted from EntityView and are first anyway
      }
      const viewId = `view-${cell.column.id}-${cell.rowId}`;
      const element = f.first(document.getElementsByClassName(viewId));
      const scroller = this.getScroller()
                           .center(element, 1);
      this.setState({focused: focusElementId});
    } else {
      const firstCell = row.cells.at(0);
      this.changeFocus(firstCell.id);
    }
  }

  componentWillUnmount = () => {
    Dispatcher.off(ActionTypes.SWITCH_ENTITY_VIEW_LANGUAGE, this.switchLang);
    Dispatcher.off(ActionTypes.SET_TRANSLATION_VIEW, this.setTranslationView);
    Dispatcher.off(ActionTypes.FILTER_ENTITY_VIEW, this.setColumnFilter);
  };

  setColumnFilter = ({id, value, filterMode}) => {
    if (id != this.props.id) {
      return;
    }

    this.setState({
      filter: {
        value,
        mode: filterMode
      }
    });
  };

  switchLang = ({langtag}) => {
    this.setState({langtag});
  };

  setTranslationView = item => {
    const oldItem = this.state.translationView;
    const newItem = {
      show: (f.isNil(item.show) ? f.prop("show", oldItem) : item.show),
      cell: (f.isNil(item.cell) ? f.prop("cell", oldItem) : item.cell)
    };
    this.setState({translationView: newItem});
  };

  getScroller = () => {
    const {id} = this.props;
    const container = f.first(document.getElementsByClassName(id.toString())).parentElement;
    return zenscroll.createScroller(container);
  };

  registerFocusable = id => el => {
    this.focusElements = f.assoc(id, el, this.focusElements);
  };

  changeFocus = dir => {
    const numericDir = (dir === Directions.UP) ? -1 : +1;
    const {focused} = this.state;
    const {langtag, filter} = this.state;
    const visibleCells = this.props.row.cells.models.filter(columnFilter(langtag, filter));
    const selectedIdx = f.findIndex(f.matchesProperty("id", focused), visibleCells);
    const {focusElements} = this;
    const toFocus = f.cond([
      [
        d => f.contains(d, [Directions.UP, Directions.DOWN]),
        d => f.prop([selectedIdx + numericDir, "id"], visibleCells)
      ],
      [
        f.stubTrue,
        f.identity
      ]
    ])(dir);

    maybe(focusElements[toFocus])
      .method("focus")
      .map(() => this.setState({focused: toFocus}));
  };

  renderTranslationView = () => {
    const {translationView, langtag, arrowPosition} = this.state;
    const arrow = (f.isNumber(arrowPosition) && f.prop("show", translationView))
      ? <div className="translation-arrow" style={{transform: `translateY(${arrowPosition}px)`}} />
      : null;
    return (translationView.show)
      ? (
        <div>
          <TranslationPopup cell={translationView.cell || {}}
                            langtag={langtag}
                            setTranslationView={this.setTranslationView}
          />
          {arrow}
        </div>
      )
      : null
  };

  setTranslationItem = el => {
    if (el && el !== this.translationItem) {
      this.translationItem = el;
    }
    const arrowPos = maybe(this.translationItem)
      .exec("getBoundingClientRect")
      .map(f.prop("top"))
      .map(pos => {
        this.setState({arrowPosition: (pos >= 120) ? pos : null});
      });
  };

  render() {
    const cells = this.props.row.cells.models;
    const {langtag, filter, translationView, focused} = this.state;

    return (
      <div className={"entity-view content-items " + this.props.id}
           onKeyDown={KeyboardShortcutsHelper.onKeyboardShortcut(this.getKeyboardShortcuts)}
      >
        {cells
          .filter(cell => cell.kind !== ColumnKinds.concat)
          .filter(columnFilter(langtag, filter))
          .map(
            (cell, idx) => {
              return <View key={idx} cell={cell} langtag={langtag}
                           setTranslationView={this.setTranslationView}
                           hasFocusedChild={f.eq(cell.id, focused)}
                           funcs={{
                             setTranslationItem: this.setTranslationItem,
                             register: this.registerFocusable(cell.id),
                             focus: this.changeFocus,
                             id: cell.id
                           }}
              />;
            })
        }
        {this.renderTranslationView()}
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

class LoadingEntityViewHeaderWrapper extends Component {
  static propTypes = {
    row: PropTypes.object,
    overlayId: PropTypes.number.isRequired,
    langtag: PropTypes.string.isRequired
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
    const {overlayId, langtag} = this.props;
    const {row} = this.state;
    const elements = (row)
      ? {
        context: getTableName(row, langtag),
        title: getDisplayLabel(row, langtag),
        components: mkHeaderComponents(overlayId, row, langtag),
        langtag
      }
      : {
        context: "",
        title: i18n.t("table:loading"),
        components: <div />,
        langtag
      };
    return <Header {...elements} />
  }
}

class LoadingEntityViewBodyWrapper extends Component {
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
      this.state = {row: null};
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

    const loadColumns = () => new Promise(
      (resolve, reject) => {
        const tableMonad = maybe(targetTable)
          .map(f.prop("columns"))
          .exec("fetch", {
            reset: true,
            success: resolve,
            error: e => {
              reject("Error initialising table columns:", e)
            }
          });
        if (tableMonad.isNone) {
          reject("No table to load row from");
        }
      }
    );

    const loadRow = () => new Promise(
      (resolve, reject) => {
        targetTable.rows.fetchById(rowId, (err, row) => {
          if (err) {
            reject("Could not retrieve row with proper Id");
          } else {
            resolve(row);
          }
        })
      }
    );

    return new Promise(
      (resolve, reject) => {
        loadColumns()
          .then(loadRow)
          .then(result => (result) ? resolve(result) : reject("Could not load desired row"))
          .catch(console.error)
      }
    );
  };

  render() {
    const {row} = this.state;
    return (row)
      ? <EntityViewBody row={row} langtag={this.props.langtag} id={this.props.overlayId}
                        registerForEvent={this.props.registerForEvent}
      />
      : null
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

export function openEntityView(row, langtag, focusElementId) {
  const rowDisplayLabel = getDisplayLabel(row, langtag);
  const tableName = getTableName(row, langtag);
  const overlayId = new Date().getTime();
  openOverlay({
    head: <Header context={tableName} title={rowDisplayLabel}
                  components={mkHeaderComponents(overlayId, row, langtag)}
    />,
    body: <EntityViewBody row={row} langtag={langtag} focusElementId={focusElementId} id={overlayId} />,
    type: "full-height",
    preferRight: true
  });
}

// target: {(tables: Tables, tableId: int > 0, | table: Table) rowId: int > 0}
export function loadAndOpenEntityView(target, langtag) {
  const overlayId = new Date().getTime();
  openOverlay({
    head: <LoadingEntityViewHeaderWrapper overlayId={overlayId} langtag={langtag} />,
    body: <LoadingEntityViewBodyWrapper overlayId={overlayId} langtag={langtag} toLoad={target} />,
    type: "full-height",
    preferRight: true
  })
}