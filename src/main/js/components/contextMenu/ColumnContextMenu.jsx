/*
 * Context menu for column options. Opened by ColumnEntry.
 */
import React from "react";
import GenericContextMenu from "./GenericContextMenu";
import TableauxConstants from "../../constants/TableauxConstants";
import listensToClickOutside from "react-onclickoutside/decorator";
import * as AccessControl from "../../helpers/accessManagementHelper";
import {compose, contains} from "lodash/fp";
import ActionCreator from "../../actions/ActionCreator";
import i18n from "i18next";
const Alignments = TableauxConstants.Alignments;

const PROTECTED_CELL_KINDS = ['concat']; //cell kinds that should not be editable

@listensToClickOutside
class ColumnContextMenu extends React.Component {
  constructor(props) {
    super(props);
    const {x, y} = props;
    this.state = {
      x: x,
      y: y
    }
  }

  handleClickOutside = evt => {
    //fix behaviour on outsideclicks; adding "react-ignore-clickoutside" class leads to different faulty behaviour
    const el = document.getElementById(this.props.popupToggleButtonId);
    const target = evt.target;
    if (el !== target) {
      this.props.closeHandler();
    }
  };

  render = () => {
    const {x, y, column, closeHandler, editHandler, langtag} = this.props;

    const canEdit =
      AccessControl.isUserAdmin() && !contains(column.kind, PROTECTED_CELL_KINDS);
    const editor_item = (canEdit)
      ? <div>
        <a href="#" onClick={compose(closeHandler, editHandler)}>
          {i18n.t("table:editor.edit_column")}
        </a>
      </div>
      : null;

    const follow_link_item = (column.isLink)
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

    return (
      <GenericContextMenu x={x-1} y={y-1}
                          clickOutsideHandler={this.closeContextMenu}
                          menuItems={
                            <div>
                              {editor_item}
                              {follow_link_item}
                            </div>
                          }
                          align={Alignments.UPPER_RIGHT} />
    )
  }
}

ColumnContextMenu.propTypes = {
  x: React.PropTypes.number.isRequired,
  y: React.PropTypes.number.isRequired,
  column: React.PropTypes.object.isRequired,
  closeHandler: React.PropTypes.func.isRequired,
  editHandler: React.PropTypes.func.isRequired,
  langtag: React.PropTypes.string.isRequired,
  popupToggleButtonId: React.PropTypes.string.isRequired,
  offset: React.PropTypes.number
};

module.exports = ColumnContextMenu;