/*
 * Consistent display of link lists for EntityView, DependentRows, etc
 * Props: table: {name: string, linkTarget: url-string}
 *        links: [{displayName, linkTarget: url-string},...]
 */

import React from "react";
import { compose, withStateHandlers, withHandlers } from "recompose";
import classNames from "classnames";
import i18n from "i18next";
import * as f from "lodash/fp";
import { loadAndOpenEntityView } from "../overlay/EntityViewOverlay";
import { List } from "react-virtualized";
import SvgIcon from "../helperComponents/SvgIcon";
import { LinkedRows } from "../cells/link/LinkOverlayFragments";
import LinkItem from "../cells/link/LinkItem";

const MAX_DISPLAYED_LINKS = 4;

const LinkList = props => {
  const { links, expanded, renderAll, renderPreview, toggleExpand } = props;
  const nLinks = links.length;
  const canExpand = nLinks > MAX_DISPLAYED_LINKS;

  return (
    <div className="link-list">
      {expanded ? renderAll() : renderPreview()}
      {canExpand ? (
        <a className="expand-button" href="#" onClick={toggleExpand}>
          <i className={expanded ? "fa fa-angle-up" : "fa fa-angle-down"} />
          {expanded
            ? i18n.t("table:show_less")
            : i18n.t("table:show_all_items", { nItems: nLinks })}
        </a>
      ) : null}
    </div>
  );
};
const proceedTo = (linkTarget, langtag) => evt => {
  if (f.isEmpty(linkTarget)) {
    return;
  }
  evt.stopPropagation();
  if (f.isString(linkTarget)) {
    window.open(linkTarget, "_blank");
  } else {
    loadAndOpenEntityView(linkTarget, langtag);
  }
};

export default compose(
  withStateHandlers(
    {
      expanded: false,
      hovered: null
    },
    {
      setExpanded: () => expanded => ({ expanded }),
      toggleExpand: ({ expanded }) => () => ({ expanded: !expanded }),
      setHovered: () => hovered => ({ hovered })
    }
  ),
  withHandlers({
    renderLink: ({ links, langtag }) => ({ index, key = index, style }) => {
      const { displayName, linkTarget } = links[index];
      return (
        <div className="link-label-wrapper-2" key={key} style={style}>
          <div
            className="link-label-wrapper"
            onClick={proceedTo(linkTarget, langtag)}
          >
            <a className="link-label" href="#">
              {displayName}
              {f.isEmpty(linkTarget) ? null : (
                <i className="fa fa-long-arrow-right" />
              )}
            </a>
          </div>
        </div>
      );
    },
    renderInteractiveLink: ({
      links,
      unlink,
      setHovered,
      hovered,
      langtag,
      sortable,
      cell
    }) => ({ index, key = index, style }) => {
      const link = links[index];
      const { displayName, linkTarget } = link;
      const isHovered = hovered === index;
      const cssClass = classNames("link-label-wrapper has-buttons", {
        "show-buttons": hovered
      });
      const nonSortableLink = () => (
        <div className="link-label-wrapper-2" style={style} key={key}>
          <div
            className={cssClass}
            onMouseEnter={setHovered}
            onMouseLeave={() => {
              if (isHovered) {
                setHovered(null);
              }
            }}
          >
            <div
              className="main-button"
              onClick={proceedTo(linkTarget, langtag)}
            >
              <a href="#">
                <div className="text-wrapper">{displayName}</div>
              </a>
              {hovered ? <i className="fa fa-long-arrow-right" /> : null}
            </div>
            {hovered ? (
              <div className="unlink-button" onClick={unlink(index)}>
                <a href="#">
                  <SvgIcon icon="cross" containerClasses="color-primary" />
                </a>
              </div>
            ) : null}
          </div>
        </div>
      );

      const sortableLink = () => {
        return (
          <div className="draggable">
            <LinkItem
              row={cell.row}
              cell={cell}
              label={link.label || link.displayName}
              langtag={langtag}
              mouseOverHandler={{
                box: () => null, //mouseOverBoxHandler,
                item: () => null
              }}
              style={style}
              isLinked
              selectedMode={0}
            />
          </div>
        );
      };
      return sortable ? sortableLink() : nonSortableLink();
    },
    renderSortableLink: ({
      links,
      cell,
      langtag,
      actions,
      setHovered,
      hovered,
      isAttachment
    }) => () => ({ index, style = {} }) => {
      const link = links[index];
      const {
        linkTarget: { tableId, rowId }
      } = link;

      const clickHandler = (_, link, evt) => {
        evt.preventDefault();
        actions.changeCellValue({
          cell,
          tableId,
          rowId,
          columnId: cell.column.id,
          oldValue: cell.value,
          newValue: f.remove(
            f.matchesProperty(isAttachment ? "uuid" : "id", f.get("id", link))
          )(cell.value)
        });
      };
      return (
        <LinkItem
          row={{ id: link.linkTarget.rowId || link.uuid }}
          cell={cell}
          toTable={link.linkTarget.tableId}
          label={link.label || link.displayName}
          langtag={langtag}
          clickHandler={clickHandler}
          mouseOverHandler={{
            box: () => null, //mouseOverBoxHandler,
            item: () =>
              setHovered(isAttachment ? link.uuid : link.linkTarget.rowId)
          }}
          style={style}
          isLinked
          isSelected={
            hovered === (isAttachment ? link.uuid : link.linkTarget.rowId)
          }
          selectedMode={0}
          isAttachment={isAttachment}
        />
      );
    },
    applySwap: ({
      value,
      links,
      actions,
      cell: { table, row, column }
    }) => ordering => () => {
      const rearranged = f
        .map(id => f.find(linkedItem => linkedItem.id === id, links), ordering)
        .map((el, idx) => ({ ...el, ordering: idx + 1 }));

      actions.changeCellValue({
        columnId: column.id,
        rowId: row.id,
        tableId: table.id,
        oldValue: value,
        newValue: rearranged
      });
    }
  }),
  withHandlers({
    renderPreview: ({
      links,
      unlink,
      renderInteractiveLink,
      renderLink,
      renderSortableLink,
      sortable,
      applySwap
    }) => () => {
      const nLinks = links.length;
      const canExpand = nLinks > MAX_DISPLAYED_LINKS;
      const renderFn = unlink ? renderInteractiveLink : renderLink;
      const cssClass = classNames("item-content", { "can-expand": canExpand });
      const renderedLinks = f
        .range(0, f.min([nLinks, MAX_DISPLAYED_LINKS]))
        .map(index => renderFn({ index }));
      return sortable ? (
        <div className="sortable">
          <div className="linked-items `${cssClass}`">
            <LinkedRows
              rowResults={{ linked: links }}
              rowsToRender={4}
              listItemRenderer={renderSortableLink}
              loading={false}
              applySwap={applySwap}
            />
          </div>
        </div>
      ) : (
        <div className={cssClass}>{renderedLinks}</div>
      );
    },
    renderAll: ({
      links,
      unlink,
      hovered,
      renderInteractiveLink,
      renderLink,
      renderSortableLink,
      sortable,
      applySwap
    }) => () => {
      const nLinks = links.length;

      return sortable ? (
        <div className="sortable">
          <div className="linked-items">
            <LinkedRows
              rowResults={{ linked: links }}
              rowsToRender={nLinks}
              listItemRenderer={renderSortableLink}
              loading={false}
              applySwap={applySwap}
            />
          </div>
        </div>
      ) : (
        <List
          width={window.innerWidth * 0.6 - 100}
          height={430}
          rowCount={nLinks}
          rowHeight={42}
          rowRenderer={unlink ? renderInteractiveLink : renderLink}
          hovered={hovered}
        />
      );
    }
  })
)(LinkList);
