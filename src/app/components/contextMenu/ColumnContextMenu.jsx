/*
 * Context menu for column options. Opened by ColumnEntry.
 */
import { translate } from "react-i18next";
import React from "react";
import f from "lodash/fp";
import listensToClickOutside from "react-onclickoutside";

import PropTypes from "prop-types";

import {
  canUserEditColumnDisplayProperty,
  canUserSeeTable
} from "../../helpers/accessManagementHelper";
import ContextMenuItem from "./ContextMenuItem";
import TableauxConstants from "../../constants/TableauxConstants";

const PROTECTED_CELL_KINDS = ["concat"]; // cell kinds that should not be editable

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
      actions: { toggleColumnVisibility },
      navigate,
      toTable
    } = this.props;

    const canEdit =
      canUserEditColumnDisplayProperty({ column }) &&
      !f.contains(column.kind, PROTECTED_CELL_KINDS);

    const MenuItem = translate(["tables"])(props => {
      console.log("MenuItem", props);
      return (
        <ContextMenuItem
          {...props}
          closeMenu={closeHandler}
          enabled={props.itemAction}
        />
      );
    });

    return (
      <div
        className="column-header-context-menu context-menu"
        style={{
          left: rect.x,
          top: rect.y,
          transform: "translateX(-100%)"
        }}
      >
        <MenuItem
          itemAction={editHandler}
          label="table:editor.edit_column"
          hide={!canEdit}
          icon="edit"
        />
        <MenuItem
          itemAction={() => navigate(`/${langtag}/tables/${toTable}`)}
          label="table:switch_table"
          icon="long-arrow-right"
          hide={
            column.kind !== TableauxConstants.ColumnKinds.link ||
            !canUserSeeTable(column.toTable)
          }
        />
        <MenuItem
          itemAction={() => toggleColumnVisibility(column.id)}
          label="table:hide_column"
          icon="eye"
        />
      </div>
    );
  };
}

ColumnContextMenu.propTypes = {
  column: PropTypes.object.isRequired,
  closeHandler: PropTypes.func.isRequired,
  editHandler: PropTypes.func.isRequired,
  langtag: PropTypes.string.isRequired,
  offset: PropTypes.number,
  rect: PropTypes.object.isRequired
};

export default ColumnContextMenu;
