import f from "lodash/fp";
import { Portal } from "react-portal";
import { ReactElement, ReactNode, useRef, useState } from "react";
import { NavigateFunction } from "react-router";
import classNames from "classnames";
import { Column, Table } from "../../types/grud";
import {
  isConcatColumn,
  isLinkColumn,
  isRowIdColumn,
  isStatusColumn
} from "../../types/guards";
import ColumnContextMenu, {
  ContextMenuItem
} from "../contextMenu/ColumnContextMenu";
import {
  getColumnDisplayName,
  retrieveTranslation
} from "../../helpers/multiLanguage";
import {
  canUserEditColumnDisplayProperty,
  canUserSeeTable
} from "../../helpers/accessManagementHelper";
import {
  ColumnEditorOverlayHeader,
  ColumnEditorOverlayBody
} from "../overlay/ColumnEditorOverlay";
import Tooltip from "../helperComponents/Tooltip/Tooltip";

type Overlay = {
  head: ReactNode;
  body: ReactNode;
  type: string;
};

type ColumnHeaderProps = {
  title?: string;
  langtag: string;
  column: Column;
  table: Table;
  navigate?: NavigateFunction;
  actions?: {
    openOverlay: (overlay: Overlay) => void;
    toggleColumnVisibility: (columnId: number) => void;
  };
};

export default function ColumnHeader({
  title,
  langtag,
  column,
  table,
  navigate = f.noop,
  actions = {
    openOverlay: f.noop,
    toggleColumnVisibility: f.noop
  }
}: ColumnHeaderProps): ReactElement {
  const headerRef = useRef<HTMLDivElement>(null);
  const headerPosition =
    headerRef.current && headerRef.current.getBoundingClientRect();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDescriptionOpen, setIsDescriptionOpen] = useState(false);
  const isStatus = isStatusColumn(column);
  const isConcat = isConcatColumn(column);
  const isLink = isLinkColumn(column);
  const isMeta = isRowIdColumn(column);
  const linkTableId = isLink ? column.toTable : null;
  const canSeeLinkTable = linkTableId && canUserSeeTable(linkTableId);
  const icon = isConcat ? "bookmark" : column.identifier ? "bookmark-o" : null;
  const displayName = title || getColumnDisplayName(column, langtag);
  const description = retrieveTranslation(langtag)(column.description || {});
  const canEdit =
    !isConcat && !isMeta && canUserEditColumnDisplayProperty({ column });

  const handleMenuOpen = () => setIsMenuOpen(true);
  const handleMenuClose = () => setIsMenuOpen(false);
  const handleDescriptionOpen = () => setIsDescriptionOpen(true);
  const handleDescriptionClose = () => setIsDescriptionOpen(false);
  const handleNavigate = (url: string) => navigate(url);
  const handleColumnHide = () => actions.toggleColumnVisibility(column.id);
  const handleEdit = () => {
    actions.openOverlay({
      // prettier-ignore
      head: <ColumnEditorOverlayHeader langtag={langtag} column={column} table={table} />,
      body: <ColumnEditorOverlayBody langtag={langtag} column={column} />,
      type: "normal"
    });
  };

  return (
    <div
      key={column.id}
      ref={headerRef}
      className={classNames("column-head", { "context-menu-open": isMenuOpen })}
    >
      <div
        className={classNames("column-name-wrapper", {
          "column-link-wrapper": isLink
        })}
        onMouseEnter={handleDescriptionOpen}
        onMouseLeave={handleDescriptionClose}
      >
        {icon && <i className={`fa fa-${icon}`} />}

        {canSeeLinkTable ? (
          <a
            className="tableHeader-inner"
            href={`/${langtag}/tables/${linkTableId}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <i className="fa fa-columns" />
            {displayName}
          </a>
        ) : (
          <div>{displayName}</div>
        )}

        {description && <i className="description-hint fa fa-info-circle" />}
      </div>

      {isDescriptionOpen && description && headerPosition && (
        <Portal>
          <Tooltip
            style={{
              left: headerPosition.left,
              top: headerPosition.bottom
            }}
            className="description-tooltip"
            defaultInvert
          >
            {description}
          </Tooltip>
        </Portal>
      )}

      {!isStatus && !isConcat && (
        <button
          className={classNames("column-contextmenu-button fa ", {
            "fa-angle-up ignore-react-onclickoutside": isMenuOpen,
            "fa-angle-down": !isMenuOpen
          })}
          draggable={false}
          onClick={isMenuOpen ? handleMenuClose : handleMenuOpen}
        />
      )}

      {isMenuOpen && headerPosition && (
        <Portal>
          <ColumnContextMenu
            style={{
              left: headerPosition.left,
              top: headerPosition.bottom
            }}
            column={column}
            onClose={handleMenuClose}
          >
            {canEdit && (
              <ContextMenuItem
                title="table:editor.edit_column"
                onClose={handleMenuClose}
                onClick={handleEdit}
                iconStart="fa-edit"
              />
            )}

            {canSeeLinkTable && (
              <ContextMenuItem
                title="table:switch_table"
                onClose={handleMenuClose}
                onClick={() =>
                  handleNavigate(`/${langtag}/tables/${linkTableId}`)
                }
                iconStart="fa-columns"
                iconEnd="fa-angle-right"
              />
            )}

            {!column.identifier && !isMeta && (
              <ContextMenuItem
                onClose={handleMenuClose}
                onClick={handleColumnHide}
                title="table:hide_column"
                iconStart="fa-eye"
              />
            )}
          </ColumnContextMenu>
        </Portal>
      )}
    </div>
  );
}
