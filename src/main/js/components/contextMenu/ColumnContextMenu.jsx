/*
 *
 */

import React from "react";
import GenericContextMenu from "./GenericContextMenu";
import TableauxConstants from "../../constants/TableauxConstants";
import listensToClickOutside from 'react-onclickoutside/decorator';
import * as AccessControl from "../../helpers/accessManagementHelper";
import {compose, contains} from 'lodash/fp';
const Alignments = TableauxConstants.Alignments;
import ActionCreator from "../../actions/ActionCreator";
import i18n from "i18next";

const PROTECTED_CELL_KINDS = ['concat', 'link']

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

  handleClickOutside() {
    this.props.closeHandler();
  }

  render() {
    const {x, y, column, closeHandler, editHandler, langtag} = this.props;

    const canEdit =
      AccessControl.isUserAdmin() && !contains(column.kind, PROTECTED_CELL_KINDS);
    const editor_item = (canEdit) ?
      <div>
        <a href="#" onClick={compose(closeHandler, editHandler)}>
          {i18n.t("table:editor.edit_column")}
        </a>
      </div> :
      null;

    const follow_link_item = (column.isLink) ?
      <div>
        <a href="#"
           onClick={compose(
             closeHandler,
             () => ActionCreator.switchTable(column.toTable, langtag))}
        >
          {i18n.t("table:switch_table")}
          <i className="fa fa-angle-right" style={{float: "right"}}></i>
        </a>
      </div> :
      null;

    return (
      <GenericContextMenu x={x} y={y}
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
  langtag: React.PropTypes.func.isRequired,

  offset: React.PropTypes.number
};

module.exports = ColumnContextMenu;