/*
 * Consistent display of link lists for EntityView, DependentRows, etc
 * Props: table: {name: string, linkTarget: url-string}
 *        links: [{displayName, linkTarget: url-string},...]
 */

import i18n from "i18next";
import f from "lodash/fp";
import React, { useCallback, useMemo, useState } from "react";
import { List } from "react-virtualized";
import { isLinkArchived } from "../../archivedRows";
import { ColumnKinds } from "../../constants/TableauxConstants";
import { canUserChangeCell } from "../../helpers/accessManagementHelper.js";
import apiUrl from "../../helpers/apiUrl";
import { retrieveTranslation } from "../../helpers/multiLanguage";
import { isLocked } from "../../helpers/rowUnlock";
import LinkItem from "../cells/link/LinkItem";
import { LinkedRows } from "../cells/link/LinkOverlayFragments";

const MAX_DISPLAYED_LINKS = 4;

const LinkList = props => {
  const {
    links,
    cell,
    langtag,
    actions,
    isAttachment,
    showToggleButton
  } = props;
  const { column, row, table, value } = cell;
  const changeCellAuthorized =
    canUserChangeCell(props.cell, props.langtag) && !isLocked(props.cell.row);
  const sortable = props.sortable && cell && changeCellAuthorized;
  const nLinks = links.length;
  const canExpand = nLinks > MAX_DISPLAYED_LINKS;
  const [expanded, setExpanded] = useState(false);
  const toggleExpand = useCallback(() => setExpanded(!expanded));
  const linksToRender = expanded
    ? links.length
    : f.take(MAX_DISPLAYED_LINKS, links).length;
  const applySwap = ordering => {
    const rearranged = f
      .map(id => f.find(linkedItem => linkedItem.id === id, links), ordering)
      .map((el, idx) => ({ ...el, ordering: idx + 1 }));

    actions.changeCellValue({
      cell,
      columnId: column.id,
      rowId: row.id,
      tableId: table.id,
      oldValue: value,
      newValue: rearranged
    });
  };

  const getViewUrl = link =>
    isAttachment ? apiUrl(retrieveTranslation(langtag, link.url)) : undefined;

  const mkListItemRenderer = fetchKey => () => ({ key, index, style = {} }) => {
    const findFn =
      fetchKey === "key" ? f.find(f.propEq("id", key)) : f.nth(index);
    const link = findFn(links);
    const {
      linkTarget: { tableId, rowId }
    } = link;
    const clickHandler = (_, link, evt) => {
      evt.preventDefault();
      if (!changeCellAuthorized) {
        return;
      }
      const httpMethodForChange =
        cell.kind === ColumnKinds.attachment ? "PUT" : "POST";
      actions.changeCellValue({
        cell,
        tableId,
        rowId,
        columnId: cell.column.id,
        oldValue: cell.value,
        newValue: f.remove(
          f.matchesProperty(isAttachment ? "uuid" : "id", f.get("id", link))
        )(cell.value),
        method: httpMethodForChange
      });
    };
    const isArchived = isLinkArchived(link);
    const id = link.linkTarget.rowId || link.uuid;
    return (
      <LinkItem
        key={id}
        showToggleButton={showToggleButton}
        row={{ id }}
        cell={cell}
        toTable={link.linkTarget.tableId}
        label={link.label || link.displayName}
        langtag={langtag}
        clickHandler={clickHandler}
        style={style}
        isLinked
        viewUrl={getViewUrl(link)}
        isPermissionDenied={link.hiddenByRowPermissions}
        archived={isArchived}
      />
    );
  };

  const renderSortableListItem = useMemo(() => mkListItemRenderer("key"), [
    links
  ]);
  const renderListItem = useMemo(mkListItemRenderer("index"), [links]);

  const ListRenderer = sortable ? (
    <div className={`sortable ${expanded && "sortable_expanded"}`}>
      <div className="linked-items">
        <LinkedRows
          entries={f.map("id", links)}
          rowsToRender={linksToRender}
          renderListItem={renderSortableListItem}
          loading={false}
          onReorder={applySwap}
        />
      </div>
    </div>
  ) : (
    <div className={`sortable ${expanded && "sortable_expanded"}`}>
      <div className="linked-items">
        <List
          width={window.innerWidth * 0.6 - 100}
          height={f.min([linksToRender * 44, 430])}
          rowCount={linksToRender}
          rowHeight={44}
          rowRenderer={renderListItem}
        />
      </div>
    </div>
  );

  return (
    <div className="link-list">
      {ListRenderer}
      {canExpand ? (
        <button className="expand-button" onClick={toggleExpand}>
          <i className={expanded ? "fa fa-angle-up" : "fa fa-angle-down"} />
          {expanded
            ? i18n.t("table:show_less")
            : i18n.t("table:show_all_items", { nItems: nLinks })}
        </button>
      ) : null}
    </div>
  );
};

export default LinkList;
