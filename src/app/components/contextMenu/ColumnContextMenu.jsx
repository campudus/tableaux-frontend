/*
 * Context menu for column options. Opened by ColumnEntry.
 */
import React from "react";
import f from "lodash/fp";
import i18n from "i18next";
import listensToClickOutside from "react-onclickoutside";

import PropTypes from "prop-types";

import {
  canUserEditColumnDisplayProperty,
  canUserSeeTable
} from "../../helpers/accessManagementHelper";
import TableauxConstants from "../../constants/TableauxConstants";

import store from "../../redux/store";
import actions from "../../redux/actionCreators";

const PROTECTED_CELL_KINDS = ["concat"]; // cell kinds that should not be editable

const ContextMenuItem = ({ iconName, title, onClick, closeMenu, children }) => {
  const handleClick = React.useCallback(() => {
    onClick();
    closeMenu();
  });
  return (
    <div className="column-context-menu__item" onMouseDown={handleClick}>
      <i className={"column-context-menu-item__icon fa " + iconName} />
      <div className="column-context-menu-item__title">{i18n.t(title)}</div>
      {children}
    </div>
  );
};

@listensToClickOutside
class ColumnContextMenu extends React.Component {
  constructor(props) {
    super(props);
    const { x, y } = props;
    this.state = {
      x: x,
      y: y
    };
  }

  handleClickOutside = evt => {
    // fix behaviour on outsideclicks; adding "react-ignore-clickoutside" class leads to different faulty behaviour
    const el = document.getElementById(this.props.popupToggleButtonId);
    const target = evt.target;
    if (el !== target) {
      this.props.closeHandler();
    }
  };

  render = () => {
    const {
      column,
      closeHandler,
      editHandler,
      langtag,
      rect,
      navigate,
      toTable,
      alignRight
    } = this.props;
    const { toggleColumnVisibility } = this.props.actions || {};
    const canEdit =
      !this.props.isMetaColumn &&
      canUserEditColumnDisplayProperty({ column }) &&
      !f.contains(column.kind, PROTECTED_CELL_KINDS);
    const editorItem = canEdit ? (
      <ContextMenuItem
        closeMenu={closeHandler}
        onClick={editHandler}
        title="table:editor.edit_column"
        iconName="fa-edit"
      />
    ) : null;

    const followLinkItem =
      !this.props.isMetaColumn &&
      column.kind === TableauxConstants.ColumnKinds.link &&
      canUserSeeTable(toTable.id) ? (
        <ContextMenuItem
          closeMenu={closeHandler}
          onClick={() => navigate("/" + langtag + "/tables/" + column.toTable)}
          title="table:switch_table"
        >
          <i className="fa fa-angle-right column-context-menu-item__icon" />
        </ContextMenuItem>
      ) : null;

    const hideColumnItem =
      this.props.isMetaColumn || this.props.isId ? null : (
        <ContextMenuItem
          closeMenu={closeHandler}
          onClick={() => toggleColumnVisibility(column.id)}
          title="table:hide_column"
          iconName="fa-eye"
        />
      );

    const sortByThisColumn = direction => () => {
      const currentFilters =
        store.getState() |> f.prop(["tableView", "filters"]);
      store.dispatch(
        actions.setFiltersAndSorting(currentFilters, {
          columnId: column.id,
          value: direction
        })
      );
    };

    const sortingItems = (
      <>
        <ContextMenuItem
          closeMenu={closeHandler}
          onClick={sortByThisColumn("ASC")}
          iconName="fa-sort-alpha-asc"
          title="filter:help.sortasc"
        />
        <ContextMenuItem
          closeMenu={closeHandler}
          onClick={sortByThisColumn("DESC")}
          iconName="fa-sort-alpha-desc"
          title="filter:help.sortdesc"
        />
      </>
    );

    return (
      <div
        className="column-header-context-menu context-menu"
        style={{
          left: rect.x,
          top: rect.y,
          transform: alignRight ? "none" : "translateX(-100%)"
        }}
      >
        {sortingItems}
        {editorItem}
        {followLinkItem}
        {hideColumnItem}
      </div>
    );
  };
}

ColumnContextMenu.propTypes = {
  column: PropTypes.object.isRequired,
  closeHandler: PropTypes.func.isRequired,
  editHandler: PropTypes.func,
  langtag: PropTypes.string,
  offset: PropTypes.number,
  rect: PropTypes.object.isRequired,
  alignRight: PropTypes.bool,
  isMetaColumn: PropTypes.bool
};

export default ColumnContextMenu;
