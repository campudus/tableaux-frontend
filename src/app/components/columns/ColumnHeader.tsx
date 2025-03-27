import i18n from "i18next";
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
import Header from "../overlay/Header";
import ColumnEditorOverlay from "../overlay/ColumnEditorOverlay";
import Tooltip from "../helperComponents/Tooltip/Tooltip";

type ColumnDetails = Pick<Column, "displayName" | "description">;

type ColumnHeaderProps = {
  title?: string;
  langtag: string;
  column: Column;
  table: Table;
  navigate?: NavigateFunction;
  actions?: {
    editColumn: (
      columnId: number,
      tableId: number,
      data: ColumnDetails
    ) => void;
    openOverlay: (payload: {
      head: ReactNode;
      body: ReactNode;
      type: string;
    }) => void;
    toggleColumnVisibility: (columnId: number) => void;
  };
};

export default function ColumnHeader({
  title,
  langtag,
  column,
  table,
  navigate = f.noop,
  actions: { editColumn, openOverlay, toggleColumnVisibility } = {
    editColumn: f.noop,
    openOverlay: f.noop,
    toggleColumnVisibility: f.noop
  }
}: ColumnHeaderProps): ReactElement {
  const headerRef = useRef<HTMLDivElement>(null);
  const headerPosition =
    headerRef.current && headerRef.current.getBoundingClientRect();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDescriptionOpen, setIsDescriptionOpen] = useState(false);
  const [details, setDetails] = useState<ColumnDetails>({
    displayName: column.displayName,
    description: column.description
  });
  const isStatus = isStatusColumn(column);
  const isConcat = isConcatColumn(column);
  const isLink = isLinkColumn(column);
  const isMeta = isRowIdColumn(column);
  const linkTableId = isLink ? column.toTable : null;
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
  const handleColumnHide = () => toggleColumnVisibility(column.id);
  const handleColumnUpdate = (details: ColumnDetails) => setDetails(details);
  const handleColumnSave = () => editColumn(column.id, table.id, details);
  const handleEdit = () => {
    openOverlay({
      head: (
        <Header
          context={i18n.t("table:editor.edit_column")}
          title={column.displayName[langtag] || column.name}
          buttonActions={{
            positive: [i18n.t("common:save"), handleColumnSave],
            neutral: [i18n.t("common:cancel"), null]
          }}
        />
      ),
      body: (
        <ColumnEditorOverlay
          langtag={langtag}
          details={details}
          handleUpdate={handleColumnUpdate}
        />
      ),
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

        {isLink && canUserSeeTable(linkTableId) ? (
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

            {isLink && canUserSeeTable(column.toTable) && (
              <ContextMenuItem
                title="table:switch_table"
                onClose={handleMenuClose}
                onClick={() =>
                  handleNavigate(`/${langtag}/tables/${column.toTable}`)
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
