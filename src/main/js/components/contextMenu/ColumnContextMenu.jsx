/*
 * Context menu for column options. Opened by ColumnEntry.
 */
import React from "react";
import listensToClickOutside from "react-onclickoutside";
import * as AccessControl from "../../helpers/accessManagementHelper";
import {compose, contains} from "lodash/fp";
import ActionCreator from "../../actions/ActionCreator";
import i18n from "i18next";
import PropTypes from "prop-types";

const PROTECTED_CELL_KINDS = ["concat"]; // cell kinds that should not be editable

@listensToClickOutside
class ColumnContextMenu extends React.Component {
  constructor(props) {
    super(props);
    const {x, y} = props;
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
    const {column, closeHandler, editHandler, langtag, tables, rect} = this.props;
    const toTable = (column.isLink)
      ? tables.get(column.toTable)
      : {};

    const canEdit =
      AccessControl.isUserAdmin() && !contains(column.kind, PROTECTED_CELL_KINDS);
    const editorItem = (canEdit)
      ? <div>
        <a href="#" onClick={compose(closeHandler, editHandler)}>
          {i18n.t("table:editor.edit_column")}
        </a>
      </div>
      : null;

    const followLinkItem = (column.isLink && !toTable.hidden)
      ? <div>
        <a href="#"
          onClick={compose(
            closeHandler,
            () => ActionCreator.switchTable(column.toTable, langtag))}
        >
          {i18n.t("table:switch_table")}
          <i className="fa fa-angle-right" style={{float: "right"}}></i>
        </a>
      </div>
      : null;

    const hideColumnItem = (this.props.isId)
      ? null
      : (
        <div>
          <a href="#"
            onClick={compose(
              closeHandler,
              () => ActionCreator.setColumnsVisibility(false, [column.id])
            )}
          >
            {i18n.t("table:hide_column")}
          </a>
        </div>
      );

    return (
      <div className="column-header-context-menu context-menu"
        style={{
          left: rect.x,
          top: rect.y,
          transform: "translateX(-100%)"
        }}
      >
        {editorItem}
        {followLinkItem}
        {hideColumnItem}
      </div>
    );
  }
}

ColumnContextMenu.propTypes = {
  column: PropTypes.object.isRequired,
  closeHandler: PropTypes.func.isRequired,
  editHandler: PropTypes.func.isRequired,
  langtag: PropTypes.string.isRequired,
  offset: PropTypes.number,
  tables: PropTypes.object.isRequired,
  rect: PropTypes.object.isRequired
};

module.exports = ColumnContextMenu;
