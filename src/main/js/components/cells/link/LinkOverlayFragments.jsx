import React from "react";
import {branch, compose, renderComponent, renderNothing, withHandlers, withProps} from "recompose";
import f from "lodash/fp";
import DragSortList from "./DragSortList";
import Spinner from "../../header/Spinner";
import {AutoSizer, List} from "react-virtualized";
import {loadAndOpenEntityView} from "../../overlay/EntityViewOverlay";
import ActionCreator from "../../../actions/ActionCreator";
import DefaultLangtag from "../../../constants/TableauxConstants";
import i18n from "i18next";
import SvgIcon from "../../helperComponents/SvgIcon";

// ---------------------------------------------------------------------------------------
// "Linked items" section

const NoLinkedRows = ({linkEmptyLines}) => (
  <div className="link-list empty-info">
    <i className="fa fa-chain-broken" />
    <div className="text">
            <span>
              {linkEmptyLines[0]}.
            </span>
      <span>
              {linkEmptyLines[1]}.
            </span>
    </div>
  </div>
);

export const LinkedRows = compose(
  branch(
    ({loading, rowResults}) => !loading && f.isEmpty(f.get("linked", rowResults)),
    renderComponent(NoLinkedRows)
  ),
  withHandlers(
    {
      renderListItem: ({listItemRenderer}) => listItemRenderer({isLinked: true})
    }
  )
)(DragSortList);

// ---------------------------------------------------------------------------------------
// "Unlinked items" section

const UnlinkedRowsFrag = (
  {
    onMouseEnter,
    rowCount,
    rowHeight,
    rowRenderer,
    noRowsRenderer,
    scrollToIndex,
    selectedMode
  }
) => (
  <div className="unlinked-items"
       onMouseEnter={onMouseEnter}
  >
    <AutoSizer>
      {({width, height}) => (
        <List width={width}
              height={height}
              rowCount={rowCount}
              rowHeight={40}
              scrollToInex={scrollToIndex}
              rowRenderer={rowRenderer}
              selectedMode={selectedMode}
        />
      )
      }
    </AutoSizer>
  </div>
);

const UnlinkedRowsOrSpinner = compose(
  branch(
    f.get("loading"),
    renderComponent(withProps({isLoading: true})(Spinner))
  ),
  withHandlers(
    {
      rowRenderer: ({renderRows}) => renderRows({isLinked: false}),
      onMouseEnter: ({setActiveBox, activeBox}) => setActiveBox(activeBox)
    }
  )
)(UnlinkedRowsFrag);

export const UnlinkedRows = branch(
  ({loading, noForeignRows}) => !loading && noForeignRows,
  renderNothing
)(UnlinkedRowsOrSpinner);

// ---------------------------------------------------------------------------------------
// Link count

const LinkStatusCountFrag = ({rowResults, maxLinks}) => (
  <span>
    (
    {f.size(rowResults.linked)}
    /
    {maxLinks}
    )
  </span>
);

export const LinkStatus = branch(
  ({maxLinks}) => !isFinite(maxLinks),
  renderNothing
)(LinkStatusCountFrag);

// ---------------------------------------------------------------------------------------
// Link count

const RowCreatorFrag = (props) => {
  const {addAndLinkRow, shiftUp, cell: {column: {displayName}}, langtag} = props;
  const linkTableName = displayName[langtag] || displayName[DefaultLangtag] || "";
  return (
    <div className={`row-creator-button${(shiftUp) ? " shift-up" : ""}`}
         onClick={addAndLinkRow}
    >
      <SvgIcon icon="plus" containerClasses="color-primary" />
      <span>{i18n.t("table:link-overlay-add-new-row", {tableName: linkTableName})}</span>
    </div>
  );
};

export const RowCreator = compose(
  branch(
    ({canAddLinks}) => !canAddLinks,
    renderNothing
  ),
  withHandlers(
    {
      addAndLinkRow: (props) => () => {
        const {cell, cell: {column: {toTable}}, langtag, updateRowResults, addLink} = props;
        const linkNewRow = (row = {}) => {
          const link = {
            id: row.id,
            value: null,
            displayValue: {}
          };
          updateRowResults((old) => [...old, link]);
          addLink(false, link);

          loadAndOpenEntityView({
            tables: cell.tables,
            tableId: toTable,
            rowId: row.id
          }, langtag);
        };
        ActionCreator.addRow(toTable, linkNewRow);
      }
    }
  )
)(RowCreatorFrag);
