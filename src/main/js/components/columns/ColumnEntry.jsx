/*
 * Entries for the table header.
 * In non-admin mode displays the header text/icon representation. If user has admin rights, rows may be selected
 * on click, second click sends Action event to open overlay to edit current header's title and description.
 */
import React from "react";
import ActionCreator from "../../actions/ActionCreator";
import ColumnEditorOverlay from "../overlay/ColumnEditorOverlay";
import i18n from "i18next";
import {compose, contains} from 'lodash/fp';
import ColumnContextMenu from "../../components/contextMenu/ColumnContextMenu";


class ColumnEntry extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      name: this.props.name,
      description: this.props.description,
      contextMenu: null
    };
  }

  calcId = () => "column-context-menu-" + JSON.stringify(this.props.column.id);

  handleInput = (inputState) => {
    this.setState(inputState);
  };

  cancelEdit = () => {
    ActionCreator.closeOverlay();
  };

  saveEdit = () => {
    const {langtag, index} = this.props;
    const {name, description} = this.state;
    const new_name = (name != this.props.name) ? name : null;
    const new_desc = (description != this.props.description) ? description : null;
    ActionCreator.editColumnHeaderDone(index, langtag, new_name, new_desc);
    ActionCreator.closeOverlay();
  };

  editColumn = () => {
    const {description, index, column, langtag} = this.props;
    const name = column.displayName[langtag] || column.name;

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
  };

  openContextMenu = (evt) => {
    if (!evt) return;
    const colHeaderCell = evt.target.parentNode;
    const rect = colHeaderCell.getBoundingClientRect();
    this.setState({
      ctxCoords: {
        x: rect.right,
        y: rect.bottom
      }
    });
  };

  closeContextMenu = () => {
    this.setState({ctxCoords: null});
  };

  toggleContextMenu = (evt) => {
    (this.state.ctxCoords) ? this.closeContextMenu() : this.openContextMenu(evt);
    evt.preventDefault();
  };

  renderContextMenu = () => {
    const {x, y} = this.state.ctxCoords;
    const {column} = this.props;

    return (
      <ColumnContextMenu x={x} y={y}
                         closeHandler={this.closeContextMenu}
                         editHandler={this.editColumn}
                         column={column}
                         langtag={this.props.langtag}
                         colId={this.calcId()}
      />
    );
  };

  render = () => {
    const {column:{kind}, index, columnContent, columnIcon} = this.props;
    const menu_open = this.state.ctxCoords;
    const header_css_class = "column-head" +
      ((menu_open) ? " contextmenu-open" : "");
    const contextmenu_css_class = "column-contextmenu-button fa " +
      ((menu_open) ? " fa-angle-up" : "fa-angle-down");

    return (
      <div className={header_css_class}
           key={index}>
        <div className={"column-name-wrapper" + ((kind === "link") ? " column-link-wrapper" : "")}>
          {columnContent}
          {columnIcon}
        </div>
        {(index > 0) ?
          <a href="#" className={contextmenu_css_class} id={this.calcId()}
             onClick={this.toggleContextMenu}>
          </a> :
          null}
        {(menu_open) ? this.renderContextMenu() : null}
      </div>
    );
  }
}

ColumnEntry.PropTypes = {
  description: React.PropTypes.string.isRequired,
  columnContent: React.PropTypes.array.isRequired,
  index: React.PropTypes.number.isRequired,
  selected: React.PropTypes.number.isRequired,
  cancelEdit: React.PropTypes.func.isRequired,
  langtag: React.PropTypes.string.isRequired,
  column: React.PropTypes.object.isRequired,
  name: React.PropTypes.string.isRequired,
};

module.exports = ColumnEntry;