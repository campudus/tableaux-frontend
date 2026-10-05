import i18n from "i18next";
import f from "lodash/fp";
import {
  CSSProperties,
  PropsWithChildren,
  ReactElement,
  useEffect,
  useLayoutEffect,
  useRef,
  useState
} from "react";
import { outsideClickEffect } from "../../helpers/useOutsideClick";
import { SortValue } from "../../constants/TableauxConstants";
import actions from "../../redux/actionCreators";
import store from "../../redux/store";
import RowFilters from "../../RowFilters/index";
import { Column } from "../../types/grud";
import { placeBelowAnchorRightAligned } from "./placement";

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
  anchorRect: DOMRect;
  column: Column;
  onClose: () => void;
}>;

export default function ColumnContextMenu({
  anchorRect,
  column,
  onClose,
  children
}: ContextMenuProps): ReactElement {
  const containerRef = useRef<HTMLDivElement>(null);
  const [menuWidth, setMenuWidth] = useState<number | null>(null);

  // Menu width depends on its (translated) content, so it can only be measured after mounting
  useLayoutEffect(() => {
    setMenuWidth(containerRef.current?.getBoundingClientRect().width ?? null);
  }, []);

  const style: CSSProperties =
    menuWidth === null
      ? { visibility: "hidden", left: 0, top: anchorRect.bottom }
      : placeBelowAnchorRightAligned({
          anchor: anchorRect,
          menuWidth,
          viewportWidth: document.documentElement.clientWidth
        });

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
