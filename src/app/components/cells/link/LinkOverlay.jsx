import "react-virtualized/styles.css";

import {
  compose,
  lifecycle,
  withHandlers,
  withProps,
  withStateHandlers
} from "recompose";
import React, { PureComponent } from "react";
import * as Sentry from "@sentry/browser";
import * as f from "lodash/fp";
import i18n from "i18next";
import store from "../../../redux/store";

import { Directions, FilterModes } from "../../../constants/TableauxConstants";
import {
  LinkedRows,
  LinkStatus,
  RowCreator,
  UnlinkedRows
} from "./LinkOverlayFragments";
import { connectOverlayToCellValue } from "../../helperComponents/connectOverlayToCellHOC";
import {
  doto,
  maybe,
  preventDefault,
  stopPropagation,
  when,
  merge
} from "../../../helpers/functools";
import {
  getColumnDisplayName,
  retrieveTranslation
} from "../../../helpers/multiLanguage";
import { loadAndOpenEntityView } from "../../overlay/EntityViewOverlay";
import { makeRequest } from "../../../helpers/apiHelper";
import { openInNewTab } from "../../../helpers/apiUrl";
import KeyboardShortcutsHelper from "../../../helpers/KeyboardShortcutsHelper";
import LinkItem from "./LinkItem";
import LinkOverlayHeader from "./LinkOverlayHeader";
import SearchFunctions from "../../../helpers/searchFunctions";
import apiRoute from "../../../helpers/apiRoutes";
import getDisplayValue from "../../../helpers/getDisplayValue";

const MAIN_BUTTON = 0;
const LINK_BUTTON = 1;
const LINKED_ITEMS = 0;
const UNLINKED_ITEMS = 1;

class LinkOverlay extends PureComponent {
  constructor(props) {
    super(props);
    this.allRowResults = {};
    this.state = {
      selectedId: {
        linked: 0,
        unlinked: 0
      },
      selectedMode: 0,
      activeBox: UNLINKED_ITEMS
    };
  }

  componentDidMount = () => {
    const { handleMyKeys } = this;
    // Expose handlers to LinkOverlayHeader
    this.props.updateSharedData(obj =>
      merge(obj, {
        passKeystrokeToBody: handleMyKeys,
        setFilterValue: this.props.setFilterValue,
        setFilterMode: this.props.setFilterMode,
        setUnlinkedOrder: this.props.setUnlinkedOrder
      })
    );
  };

  handleMyKeys = event => {
    KeyboardShortcutsHelper.onKeyboardShortcut(this.getKeyboardShortcuts)(
      event
    );
  };

  getKeyboardShortcuts = () => {
    const { selectedMode, activeBox } = this.state;
    const rows = f.get(
      activeBox === UNLINKED_ITEMS ? "unlinked" : "linked",
      this.props.rowResults
    );
    const selectNext = dir => {
      const N = f.size(rows);
      const selectedId = this.getSelectedId();
      const nextIdx = (selectedId + (dir === Directions.UP ? -1 : 1) + N) % N;
      this.setSelectedId(nextIdx);
    };
    const focusInput = () => maybe(this.props.sharedData).method("focusInput");
    return {
      enter: event => {
        const { activeBox } = this.state;
        const { rowResults } = this.props;
        const activeBoxIDString =
          activeBox === LINKED_ITEMS ? "linked" : "unlinked";
        const row = f.get(
          [activeBoxIDString, this.getSelectedId()],
          rowResults
        );
        if (f.isEmpty(row)) {
          return;
        }
        if (selectedMode === MAIN_BUTTON) {
          this.addLinkValue(activeBox === LINKED_ITEMS, row, event);
        } else {
          const { cell } = this.props;
          const target = {
            tableId: cell.column.toTable,
            rowId: row.id,
            langtag: this.props.langtag
          };
          loadAndOpenEntityView(target);
        }
      },
      escape: event => {
        preventDefault(event);
        stopPropagation(event);
        this.props.actions.closeOverlay();
      },
      up: event => {
        preventDefault(event);
        stopPropagation(event);
        selectNext(Directions.UP);
        if (this.state.activeBox === LINKED_ITEMS && event.shiftKey) {
          const selectedId = this.getSelectedId();
          if (selectedId > 0) {
            this.swapLinkedItems(selectedId - 1, selectedId);
          }
        }
        focusInput();
      },
      down: event => {
        preventDefault(event);
        stopPropagation(event);
        selectNext(Directions.DOWN);
        if (this.state.activeBox === LINKED_ITEMS && event.shiftKey) {
          const selectedId = this.getSelectedId();
          if (selectedId < f.size(this.props.rowResults.linked)) {
            this.swapLinkedItems(selectedId, selectedId + 1);
          }
        }
        focusInput();
      },
      right: event => {
        preventDefault(event);
        stopPropagation(event);
        this.setState({ selectedMode: LINK_BUTTON });
      },
      left: event => {
        preventDefault(event);
        stopPropagation(event);
        this.setState({ selectedMode: MAIN_BUTTON });
      },
      tab: event => {
        preventDefault(event);
        stopPropagation(event);
        if (event.shiftKey) {
          this.setState({ selectedMode: (selectedMode + 1) % 2 });
        } else {
          this.setState({ activeBox: (activeBox + 1) % 2 });
        }
        focusInput();
      }
    };
  };

  setSelectedId = id => {
    const activeBox =
      this.state.activeBox === LINKED_ITEMS ? "linked" : "unlinked";
    const idToSet = f.clamp(
      0,
      f.size(f.get(activeBox, this.props.rowResults)) - 1,
      id
    );
    this.setState({
      selectedId: f.assoc(activeBox, idToSet, this.state.selectedId)
    });
  };

  getSelectedId = () => {
    const activeBox =
      this.state.activeBox === LINKED_ITEMS ? "linked" : "unlinked";
    return f.get(activeBox, this.state.selectedId);
  };

  canAddLink = () => {
    return f.size(this.props.rowResults.linked) < this.props.maxLinks;
  };

  addLinkValue = (isAlreadyLinked, link, event) => {
    maybe(event).method("preventDefault");
    const shouldLink = !isAlreadyLinked;
    const { maxLinks, cell, actions, value } = this.props;

    if (shouldLink && !this.canAddLink()) {
      actions.showToast(
        <div id="cell-jump-toast">
          {i18n.t("table:cardinality-reached", { maxLinks })}
        </div>
      );
      Sentry.captureMessage("Tried to add link with wrong cardinality", {
        level: "warning"
      });
      return;
    }

    const withoutLink = f.remove(f.matchesProperty("id", f.get("id", link)));
    const links = !shouldLink ? withoutLink(value) : [...value, link];

    const { table, column, row } = cell;
    actions.changeCellValue({
      tableId: table.id,
      rowId: row.id,
      columnId: column.id,
      oldValue: value,
      newValue: links,
      onSuccess: () => {
        if (!shouldLink && f.isFinite(maxLinks)) {
          this.props.fetchForeignRows();
        }
      }
    });
  };

  setActiveBox = val => e => {
    this.setState({ activeBox: val });
    e.stopPropagation();
  };

  renderListItem = ({ isLinked }) => ({ key, index, style = {} }) => {
    const { selectedMode, activeBox } = this.state;
    const rowResults = f.get(
      isLinked ? "linked" : "unlinked",
      this.props.rowResults
    );
    const row = rowResults[index];

    if (f.isEmpty(rowResults) || f.isEmpty(row)) {
      return null;
    }

    const isSelected =
      this.getSelectedId() === index &&
      activeBox === (isLinked ? LINKED_ITEMS : UNLINKED_ITEMS);
    const { langtag, cell } = this.props;

    const refIfLinked = el => {
      if (isLinked) {
        this.elements = f.assoc(index, el, this.elements || {});
      }
    };

    const mouseOverBoxHandler = val => e => {
      this.setState({
        selectedMode: val,
        activeBox: isLinked ? LINKED_ITEMS : UNLINKED_ITEMS
      });
      e.stopPropagation();
    };

    const mouseOverItemHandler = index => e => {
      this.setSelectedId(index);
      this.setState({ activeBox: isLinked ? LINKED_ITEMS : UNLINKED_ITEMS });
      e.stopPropagation();
    };

    return (
      <LinkItem
        key={`${key}-${row.id}`}
        mouseOverHandler={{
          box: mouseOverBoxHandler,
          item: mouseOverItemHandler(index)
        }}
        refIfLinked={refIfLinked}
        clickHandler={this.addLinkValue}
        isLinked={isLinked}
        isSelected={isSelected}
        row={row}
        cell={cell}
        label={row.label}
        langtag={langtag}
        style={style}
        selectedMode={selectedMode}
      />
    );
  };

  swapLinkedItems = (a, b) => {
    const {
      value,
      rowResults,
      actions,
      cell: { table, row, column }
    } = this.props;
    const linkedItems = rowResults.linked;

    const rearranged = f.flow(
      f.assoc(b, f.get(a, linkedItems)),
      f.assoc(a, f.get(b, linkedItems))
    )(linkedItems);

    actions.changeCellValue({
      columnId: column.id,
      rowId: row.id,
      tableId: table.id,
      oldValue: value,
      newValue: rearranged
    });
  };

  render() {
    const {
      cell,
      cell: { column },

      langtag,
      rowResults = {},
      loading,
      unlinkedOrder,
      maxLinks,
      grudData,
      actions
    } = this.props;

    const targetTable = {
      tableId: column.toTable,
      langtag
    };

    const isToTableHidden = grudData.tables.data[column.toTable].hidden;

    // there are no unlinked rows or link cardinality reached
    const noForeignRows = f.isEmpty(rowResults.unlinked) || !this.canAddLink();

    // because keeping track of multiple partial localisation strings gets more tiresome...
    const linkEmptyLines = i18n.t("table:link-overlay-empty").split(".");

    return (
      <div
        onKeyDown={KeyboardShortcutsHelper.onKeyboardShortcut(
          this.getKeyboardShortcuts
        )}
        className="link-overlay"
        tabIndex={1}
        ref={el => {
          this.background = el;
        }}
      >
        <div
          className={`linked-items${
            !loading && noForeignRows ? " no-unlinked" : ""
          }`}
          onMouseEnter={this.setActiveBox(LINKED_ITEMS)}
        >
          <span className="items-title">
            <span>
              {i18n.t("table:link-overlay-items-title")}
              {isToTableHidden ? (
                getColumnDisplayName(column, langtag)
              ) : (
                <a
                  className="table-link"
                  href="#"
                  onClick={() => openInNewTab(targetTable)}
                >
                  {getColumnDisplayName(column, langtag)}
                </a>
              )}
            </span>
            <LinkStatus rowResults={rowResults} maxLinks={maxLinks} />
          </span>
          <LinkedRows
            loading={loading}
            linkEmptyLines={linkEmptyLines}
            listItemRenderer={this.renderListItem}
            swapItems={this.swapLinkedItems}
            rowResults={rowResults}
          />
        </div>
        <UnlinkedRows
          loading={loading}
          order={unlinkedOrder}
          noForeignRows={noForeignRows}
          rowCount={f.size(rowResults.unlinked) + 1}
          renderRows={this.renderListItem}
          scrollToIndex={this.state.selectedId.unlinked}
          setActiveBox={this.setActiveBox}
          activeBox={UNLINKED_ITEMS}
          selectedBox={this.state.activeBox}
          selectedMode={this.state.selectedMode}
        />
        <RowCreator
          langtag={langtag}
          canAddLinks={this.canAddLink()}
          cell={cell}
          shiftUp={noForeignRows && !loading}
          updateRowResults={this.updateRowResults}
          addLink={this.addLinkValue}
          actions={actions}
        />
      </div>
    );
  }
}

const withDataRows = compose(
  withStateHandlers(
    {
      foreignRows: null,
      toIdColumn: null,
      loading: true
    },
    {
      setForeignRows: () => foreignRows => ({ foreignRows }),
      setLoading: () => loading => ({ loading }),
      setToIdColumn: () => toIdColumn => ({ toIdColumn })
    }
  ),
  connectOverlayToCellValue,
  withHandlers({
    fetchColumnDescription: ({ cell, setToIdColumn }) => () => {
      const { column } = cell;
      const url = apiRoute.toColumn({
        tableId: column.toTable,
        columnId: column.toColumn.id
      });
      makeRequest({
        apiRoute: url
      }).then(setToIdColumn);
    },
    fetchForeignRows: ({
      cell,
      setForeignRows,
      setLoading,
      value,
      actions,
      foreignRows
    }) => async shouldAddLink => {
      setLoading(true);
      const { column, table, row } = cell;
      const url =
        apiRoute.toCell({
          tableId: table.id,
          columnId: column.id,
          rowId: row.id
        }) + "/foreignRows";
      const rows = await makeRequest({ apiRoute: url })
        .then(result => {
          const { rows } = result;
          return f.map(row => {
            return { id: row.id, value: row.values[0] };
          }, rows);
        })
        .then(rows => {
          if (
            shouldAddLink &&
            foreignRows.length < [...value, ...rows].length
          ) {
            const last = f.last(rows);
            const newRow = { ...last, label: getDisplayValue(last) };
            actions.changeCellValue({
              cell,
              oldValue: value,
              newValue: [...value, newRow]
            });
          }
          return rows;
        })
        .catch(err => {
          console.error("Error loading foreignRows:", err);
          return [];
        });
      // Maximum available rows: rows from initial value plus
      // available ones. Otherwise we lose available items when we
      // remove links from `value`

      setForeignRows([...value, ...rows]);
      setLoading(false);
      // Add the foreign values to the link's displayValues cache,
      // else they might display <empty> when they were not linked by
      // another row before
      actions.addDisplayValues({
        displayValues: [
          {
            tableId: cell.column.toTable,
            values: [...value, ...rows].map(foreignValue => ({
              id: foreignValue.id,
              values: [
                getDisplayValue(cell.column.toColumn, foreignValue.value)
              ]
            }))
          }
        ]
      });
    },
    setFilterValue: ({ id, actions }) => filterValue =>
      actions.setOverlayState({ id, filterValue }),
    setFilterMode: ({ id, actions }) => filterMode =>
      actions.setOverlayState({ id, filterMode }),
    setUnlinkedOrder: ({ id, actions }) => unlinkedOrder =>
      actions.setOverlayState({ id, unlinkedOrder })
  }),
  withProps(
    // Apply filtering, sorting, and displayValue extraction to all available links
    ({
      langtag,
      filterValue,
      filterMode = FilterModes.CONTAINS,
      unlinkedOrder,
      foreignRows = [],
      value,
      toIdColumn,
      cell,
      loading
    }) => {
      if (loading || f.isNil(toIdColumn)) {
        return { rowResults: {}, maxLinks };
      }

      const getCurrentDisplayValue = f.flow(
        f.props(["value", "values.0"]),
        f.find(f.identity),
        getDisplayValue(toIdColumn),
        retrieveTranslation(langtag)
      );

      const linkedIds = f.map("id", value);

      const searchFunction = el =>
        SearchFunctions[filterMode](filterValue, el.label);
      const filterFn = f.isEmpty(filterValue) ? f.stubTrue : searchFunction;
      const sortMode = when(f.isNil, f.always(0), unlinkedOrder);
      const sortValue = [
        f.prop("id"),
        el => el.label && el.label.toLowerCase()
      ][sortMode];

      const maxLinks =
        f.get(["column", "constraint", "cardinality", "to"], cell) || Infinity;

      const mapIndexed = f.map.convert({ cap: false });

      const connectCellToDisplayValue = (cell, value) => {
        const state = store.getState();
        const tableDisplayValues = f.get(
          ["tableView", "displayValues", cell.column.toTable],
          state
        );
        const displayValue = mapIndexed((value, index) => {
          const displayValueObj = f.find(displayValue => {
            return displayValue.id === value.id;
          }, tableDisplayValues);
          if (!f.isNil(displayValueObj)) {
            return f.get(["values", 0], displayValueObj);
          }
          return cell.displayValue[index];
        }, value);
        const valueWithUpdatedLabels = mapIndexed((val, index) => {
          return { ...val, label: displayValue[index][langtag] };
        }, value);
        return { ...cell, displayValue, value: valueWithUpdatedLabels };
      };

      const updatedCell = connectCellToDisplayValue(cell, value);

      const rowResults = doto(
        [
          ...updatedCell.value,
          ...(updatedCell.value.length < maxLinks ? foreignRows : [])
        ],
        f.uniqBy(f.prop("id")),
        f.map(link => {
          return { ...link, label: link.label || getCurrentDisplayValue(link) };
        }),
        f.groupBy(link =>
          f.contains(link.id, linkedIds) ? "linked" : "unlinked"
        ),
        f.update(
          "unlinked",
          f.flow(
            f.filter(filterFn),
            f.sortBy(sortValue)
          )
        )
      );

      return {
        cell: updatedCell,
        maxLinks,
        rowResults
      };
    }
  ),
  lifecycle({
    componentWillMount() {
      this.props.fetchColumnDescription();
      this.props.fetchForeignRows();
    },
    componentWillReceiveProps(nextProps) {
      if (
        this.props.grudData.overlays.length > nextProps.grudData.overlays.length
      ) {
        this.props.fetchForeignRows(true);
      }
    }
  })
);

export const openLinkOverlay = ({ cell, langtag, actions }) => {
  const ReduxLinkOverlay = withDataRows(LinkOverlay);
  const overlayContent = <ReduxLinkOverlay cell={cell} langtag={langtag} />;

  actions.openOverlay({
    head: <LinkOverlayHeader langtag={langtag} cell={cell} title={cell} />,
    body: overlayContent,
    type: "full-height",
    classes: "link-overlay",
    title: cell,
    filterMode: FilterModes.CONTAINS,
    unlinkedOrder: 1
  });
};

export default withDataRows(LinkOverlay);
