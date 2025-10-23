import i18n from "i18next";
import f from "lodash/fp";
import React, { useCallback } from "react";
import { useSelector } from "react-redux";
import { AutoSizer, List } from "react-virtualized";
import {
  branch,
  compose,
  pure,
  renderComponent,
  renderNothing,
  withHandlers,
  withProps
} from "recompose";
import { canUserCreateRow } from "../../../helpers/accessManagementHelper";
import { retrieveTranslation } from "../../../helpers/multiLanguage";
import Spinner from "../../header/Spinner";
import SvgIcon from "../../helperComponents/SvgIcon";
import DragSortList from "./DragSortList";

// ---------------------------------------------------------------------------------------
// "Linked items" section

const NoLinkedRows = ({ linkEmptyLines }) => (
  <div className="link-list empty-info">
    <i className="fa fa-chain-broken" />
    <div className="text">
      <span>{linkEmptyLines[0]}.</span>
      <span>{linkEmptyLines[1]}.</span>
    </div>
  </div>
);

export const LinkedRows = compose(
  branch(
    ({ loading, entries }) => !loading && f.isEmpty(entries),
    renderComponent(NoLinkedRows)
  ),
  withHandlers({
    renderListItem: ({ renderListItem }) => renderListItem({ isLinked: true })
  })
)(DragSortList);

// ---------------------------------------------------------------------------------------
// "Unlinked items" section

const UnlinkedRowsFrag = ({
  onMouseEnter,
  rowCount,
  //  rowHeight,
  rowRenderer,
  //  noRowsRenderer,
  scrollToIndex,
  selectedMode,
  selectedBox,
  order,
  rowResults
}) => (
  <div className="unlinked-items" onMouseEnter={onMouseEnter}>
    <AutoSizer>
      {({ width, height }) => (
        <List
          redrawProp={rowResults}
          width={width}
          height={height}
          rowCount={rowCount}
          rowHeight={44}
          scrollToIndex={scrollToIndex}
          rowRenderer={rowRenderer}
          selectedMode={selectedMode}
          selectedBox={selectedBox}
          sortBy={order}
        />
      )}
    </AutoSizer>
  </div>
);

const UnlinkedRowsOrSpinner = compose(
  branch(
    f.get("loading"),
    renderComponent(withProps({ isLoading: true })(Spinner))
  ),
  withHandlers({
    rowRenderer: ({ renderRows }) => renderRows({ isLinked: false }),
    onMouseEnter: ({ setActiveBox, activeBox }) => setActiveBox(activeBox)
  })
)(UnlinkedRowsFrag);

export const UnlinkedRows = branch(
  ({ loading, noForeignRows }) => !loading && noForeignRows,
  renderNothing
)(UnlinkedRowsOrSpinner);

// ---------------------------------------------------------------------------------------
// Link count

const LinkStatusCountFrag = ({ rowResults, maxLinks }) => {
  const [pre, middle, post] = i18n.t("table:link-overlay-count").split("|");
  return (
    <span className="link-status-count">
      <span className="text">{pre}</span>
      <span className="number">{f.size(rowResults.linked)}</span>
      <span className="text">{middle}</span>
      <span className="number">{maxLinks}</span>
      <span className="text">{post}</span>
    </span>
  );
};

export const LinkStatus = branch(
  ({ maxLinks }) => !isFinite(maxLinks),
  renderNothing
)(LinkStatusCountFrag);

// ---------------------------------------------------------------------------------------
// Link count

export const RowCreator = props => {
  const {
    canAddLinks,
    shiftUp,
    cell: {
      column: { displayName, toTable: toTableId }
    },
    langtag
  } = props;

  const toTable = useSelector(store => store.tables.data[toTableId]);
  const addAndLinkRow = useCallback(() => {
    const {
      cacheNewForeignRow,
      cell,
      cell: {
        column: { toTable }
      },
      langtag,
      actions: { addEmptyRowAndOpenEntityView }
    } = props;

    addEmptyRowAndOpenEntityView(
      toTable,
      langtag,
      cell,
      cacheNewForeignRow /* onSuccess */
    );
  }, []);

  const linkTableName = retrieveTranslation(langtag, displayName);
  return canAddLinks && canUserCreateRow({ table: toTable }) ? (
    <div
      className={`row-creator-button${shiftUp ? " shift-up" : ""}`}
      onClick={addAndLinkRow}
    >
      <SvgIcon icon="plus" containerClasses="color-primary" />
      <span>
        {i18n.t("table:link-overlay-add-new-row", { tableName: linkTableName })}
      </span>
    </div>
  ) : null;
};

export const SwitchSortingButton = compose(
  pure,
  withHandlers({
    switchSortMode: ({ setSortOrder, sortOrder, sortIcons }) => () =>
      setSortOrder((sortOrder + 1) % sortIcons.length)
  })
)(props => {
  const { switchSortMode, sortIcons, sortOrder } = props;
  return (
    <button className="sort-mode-button" onClick={switchSortMode}>
      <i className={sortIcons[sortOrder]} />
    </button>
  );
});
