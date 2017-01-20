/*
 * Entries for the table header.
 * In non-admin mode displays the header text/icon representation. If user has admin rights, rows may be selected
 * on click, second click sends Action event to open overlay to edit current header's title and description.
 */
import React from "react";
import AmpersandMixin from "ampersand-react-mixin";
import ActionCreator from "../../actions/ActionCreator";
import ColumnEditorOverlay from "../overlay/ColumnEditorOverlay";
import i18n from "i18next";
import * as AccessControl from "../../helpers/accessManagementHelper";
import {compose, contains} from 'lodash/fp';
import ColumnContextMenu from "../../components/contextMenu/ColumnContextMenu";

const PROTECTED_CELL_KINDS = ['concat', 'link']

const ColumnEntry = React.createClass({
  mixins: [AmpersandMixin],

  PropTypes: {
    description: React.PropTypes.string.isRequired,
    columnContent: React.PropTypes.array.isRequired,
    index: React.PropTypes.number.isRequired,
    selected: React.PropTypes.number.isRequired,
    cancelEdit: React.PropTypes.func.isRequired,
    langtag: React.PropTypes.string.isRequired,
    column: React.PropTypes.object.isRequired,
    name: React.PropTypes.string.isRequired,
  },

  getInitialState() {
    return {
      name: this.props.name,
      description: this.props.description,
      contextMenu: null
    };
  },

  handleInput(inputState) {
    this.setState(inputState);
  },

  cancelEdit() {
    ActionCreator.closeOverlay();
  },

  saveEdit() {
    const {langtag, index} = this.props;
    const {name, description} = this.state;
    const new_name = (name != this.props.name) ? name : null;
    const new_desc = (description != this.props.description) ? description : null;
    ActionCreator.editColumnHeaderDone(index, langtag, new_name, new_desc);
    ActionCreator.closeOverlay();
  },

  editColumn() {
    const {name, description, index} = this.props;
    this.setState(this.getInitialState());
    ActionCreator.openOverlay({
      head: <text>{i18n.t('table:editor.edit_column')}</text>,
      body: <ColumnEditorOverlay name={name}
                                 handleInput={this.handleInput}
                                 description={description}
                                 index={index} />,
      footer: <div className="column-editor-footer">
        <a href="#" className="button positive" onClick={this.saveEdit}>
          {i18n.t('common:save')}
        </a>
        <a href="#" className="button neutral" onClick={this.cancelEdit}>
          {i18n.t('common:cancel')}
        </a>
      </div>,
      closeOnBackgoundClicked: true,
      type: "flexible"
    });
  },

  openContextMenu(evt) {
    const colHeaderCell = evt.target.parentNode;
    console.log("Arrow parent:", colHeaderCell);
    const rect = colHeaderCell.getBoundingClientRect();
    console.log(colHeaderCell.getBoundingClientRect());
    this.setState({
      ctxCoords: {
        x: rect.right,
        y: rect.bottom
      }
    });
  },

  closeContextMenu() {
    this.setState({ctxCoords: null});
  },

  renderContextMenu() {
    const {x, y} = this.state.ctxCoords;
    const {column} = this.props;

    if (column.kind === "link") {
      console.log(column)
    }

    const canEdit =
      AccessControl.isUserAdmin() &&
      !contains(column.kind, PROTECTED_CELL_KINDS);
    const editor_item = (canEdit) ?
      <div>
        <a href="#" onClick={compose(this.closeContextMenu, this.editColumn)}>
          {i18n.t("table:editor.edit_column")}
        </a>
      </div> :
      null;

    const follow_link_item = (column.isLink) ?
      <div>
        <a href="#"
           onClick={compose(
             this.closeContextMenu,
             () => ActionCreator.switchTable(column.toTable, this.props.langtag))}
        >
          {i18n.t("table:switch_table")}
        </a>
      </div> :
      null;

    return (
      <ColumnContextMenu x={x} y={y}
                         clickOutsideHandler={this.closeContextMenu}
                         menuItems={
                           <div>
                             {editor_item}
                             {follow_link_item}
                           </div>
                         }
      />
    );
  },

  render() {
    const {index, columnContent, columnIcon} = this.props;

    return (
      <div className="column-head"
           key={index}>
        {columnContent}
        {columnIcon}
        {(index > 0) ?
          <a href="#" className="fa fa-caret-down" style={{float: "right"}}
             onClick={this.openContextMenu}>
          </a> :
          null}
        {(this.state.ctxCoords) ? this.renderContextMenu() : null}
      </div>
    );
  }
});

module.exports = ColumnEntry;