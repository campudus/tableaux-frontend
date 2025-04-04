import i18n from "i18next";
import f from "lodash/fp";
import {
  CSSProperties,
  PropsWithChildren,
  ReactElement,
  useEffect,
  useRef
} from "react";
import { outsideClickEffect } from "../../helpers/useOutsideClick";
import { SortValue } from "../../constants/TableauxConstants";
import actions from "../../redux/actionCreators";
import store from "../../redux/store";
import RowFilters from "../../RowFilters/index";
import { Column } from "../../types/grud";

type ContextMenuItemProps = {
  title: string;
  onClick: () => void;
  onClose: () => void;
  iconStart?: string;
  iconEnd?: string;
};

export const ContextMenuItem = ({
  title,
  onClick,
  onClose,
  iconStart,
  iconEnd
}: ContextMenuItemProps) => {
  const handleClick = () => {
    onClick();
    onClose();
  };

  return (
    <div className="column-context-menu__item" onClick={handleClick}>
      {iconStart && (
        <i className={`column-context-menu-item__icon fa ${iconStart}`} />
      )}
      <div className="column-context-menu-item__title">{i18n.t(title)}</div>
      {iconEnd && (
        <i className={`column-context-menu-item__icon fa ${iconEnd}`} />
      )}
    </div>
  );
};

type ContextMenuProps = PropsWithChildren<{
  style: CSSProperties;
  column: Column;
  onClose: () => void;
}>;

export default function ColumnContextMenu({
  style,
  column,
  onClose,
  children
}: ContextMenuProps): ReactElement {
  const containerRef = useRef<HTMLDivElement>(null);

  const sortByThisColumn = (direction: string) => () => {
    const currentFilters = f.prop(["tableView", "filters"], store.getState());
    store.dispatch(
      actions.setFiltersAndSorting(currentFilters, {
        colName: column.name,
        direction
      })
    );
  };

  useEffect(
    outsideClickEffect({
      shouldListen: true,
      containerRef,
      onOutsideClick: onClose
    }),
    [containerRef.current]
  );

  return (
    <div
      ref={containerRef}
      style={style}
      className="column-header-context-menu context-menu"
    >
      {RowFilters.canSortByColumnKind(column.kind) && (
        <>
          <ContextMenuItem
            onClose={onClose}
            onClick={sortByThisColumn(SortValue.asc)}
            title="filter:help.sortasc"
            iconStart="fa-sort-alpha-asc"
          />
          <ContextMenuItem
            onClose={onClose}
            onClick={sortByThisColumn(SortValue.desc)}
            title="filter:help.sortdesc"
            iconStart="fa-sort-alpha-desc"
          />
        </>
      )}
      {children}
    </div>
  );
}
