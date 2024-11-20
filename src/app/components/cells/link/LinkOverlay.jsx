/* eslint react/no-this-in-sfc: 0 */

import React, { PureComponent } from "react";
import * as f from "lodash/fp";
import i18n from "i18next";
import TaxonomyLinkOverlay from "../../taxonomy/TaxonomyLinkOverlay";

import { Directions, FilterModes } from "../../../constants/TableauxConstants";
import {
  LinkedRows,
  LinkStatus,
  RowCreator,
  UnlinkedRows
} from "./LinkOverlayFragments";
import { canUserSeeTable } from "../../../helpers/accessManagementHelper";
import { getColumnDisplayName } from "../../../helpers/multiLanguage";
import { loadAndOpenEntityView } from "../../overlay/EntityViewOverlay";
import {
  maybe,
  preventDefault,
  stopPropagation,
  merge
} from "../../../helpers/functools";
import { openInNewTab } from "../../../helpers/apiUrl";
import KeyboardShortcutsHelper from "../../../helpers/KeyboardShortcutsHelper";
import LinkItem from "./LinkItem";
import LinkOverlayHeader from "./LinkOverlayHeader";
import withCachedLinks from "./LinkOverlayCache.jsx";
import { isTaxonomyTable } from "../../taxonomy/taxonomy";
import store from "../../../redux/store";
import { buildClassName } from "../../../helpers/buildClassName";
import { isRowArchived } from "../../../archivedRows/helpers";
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
      return;
    }

    const withoutLink = f.remove(f.matchesProperty("id", f.get("id", link)));
    const links = !shouldLink ? withoutLink(value) : [...value, link];

    const { table, column, row } = cell;
    actions.changeCellValue({
      cell,
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
    const row = isLinked
      ? f.find(f.propEq("id", key), rowResults)
      : rowResults[index];

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

    return row && cell ? (
      <LinkItem
        key={`${key}-${row.id}`}
        refIfLinked={refIfLinked}
        clickHandler={this.addLinkValue}
        isLinked={isLinked}
        isSelected={isSelected}
        archived={isRowArchived(row)}
        row={row}
        toTable={f.get(["column", "toTable"], cell)}
        cell={cell}
        label={row.label}
        langtag={langtag}
        style={style}
        selectedMode={selectedMode}
        isPermissionDenied={row.hiddenByRowPermissions}
      />
    ) : (
      undefined
    );
  };

  swapLinkedItems = (a, b) => {
    const {
      value,
      rowResults,
      actions,
      cell,
      cell: { table, row, column }
    } = this.props;
    const linkedItems = rowResults.linked;

    const rearranged = f.flow(
      f.assoc(b, f.get(a, linkedItems)),
      f.assoc(a, f.get(b, linkedItems))
    )(linkedItems);

    actions.changeCellValue({
      cell,
      columnId: column.id,
      rowId: row.id,
      tableId: table.id,
      oldValue: value,
      newValue: rearranged
    });
  };

  applySwap = ordering => {
    const {
      value,
      rowResults,
      actions,
      cell,
      cell: { table, row, column }
    } = this.props;
    const linkedItems = rowResults.linked;

    const rearranged = f.map(
      id => f.find(el => el.id === id, linkedItems),
      ordering
    );
    actions.changeCellValue({
      cell,
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
      rowResults = { linked: [], unlinked: [] },
      loading,
      unlinkedOrder,
      maxLinks,
      actions
    } = this.props;
    const targetTable = {
      tableId: column.toTable,
      langtag
    };

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
              {!canUserSeeTable(column.toTable) ? (
                getColumnDisplayName(column, langtag)
              ) : (
                <button
                  className="table-link"
                  onClick={() => openInNewTab(targetTable)}
                >
                  {getColumnDisplayName(column, langtag)}
                </button>
              )}
            </span>
            <LinkStatus rowResults={rowResults} maxLinks={maxLinks} />
          </span>
          <LinkedRows
            loading={loading}
            linkEmptyLines={linkEmptyLines}
            renderListItem={this.renderListItem}
            swapItems={this.swapLinkedItems}
            onReorder={this.applySwap}
            entries={f.map("id", rowResults.linked)}
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
          rowResults={rowResults}
        />
        <RowCreator
          langtag={langtag}
          canAddLinks={this.canAddLink()}
          cell={cell}
          shiftUp={noForeignRows && !loading}
          updateRowResults={this.updateRowResults}
          addLink={this.addLinkValue}
          cacheNewForeignRow={this.props.cacheNewForeignRow}
          actions={actions}
        />
      </div>
    );
  }
}

export const openLinkOverlay = ({ cell, langtag, actions }) => {
  const ReduxLinkOverlay = withCachedLinks(LinkOverlay);
  const linkTargetTableId = cell.column.toTable;
  const linkTargetTable = f.prop(
    ["tables", "data", linkTargetTableId],
    store.getState()
  );

  const isTaxonomyLink = isTaxonomyTable(linkTargetTable);
  const Header = isTaxonomyLink
    ? TaxonomyLinkOverlay.Header
    : LinkOverlayHeader;
  const Body = isTaxonomyLink ? TaxonomyLinkOverlay.Body : ReduxLinkOverlay;
  const overlayClass = buildClassName("link-overlay", {
    taxonomy: isTaxonomyLink
  });

  actions.openOverlay({
    head: <Header langtag={langtag} cell={cell} title={cell} />,
    body: <Body cell={cell} langtag={langtag} />,
    type: "full-height",
    classes: overlayClass,
    title: cell,
    filterMode: FilterModes.CONTAINS,
    unlinkedOrder: 1
  });
};

export default withCachedLinks(LinkOverlay);
