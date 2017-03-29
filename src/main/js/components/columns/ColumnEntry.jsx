/*
 * Entries for the table header.
 * In non-admin mode displays the header text/icon representation. If user has admin rights, rows may be selected
 * on click, second click sends Action event to open overlay to edit current header's title and description.
 */
import React from "react";
import ActionCreator from "../../actions/ActionCreator";
import i18n from "i18next";
import {compose, contains, trim} from "lodash/fp";
import ColumnContextMenu from "../../components/contextMenu/ColumnContextMenu";
import classNames from "classnames";
import Footer from "../overlay/Footer";
import Header from "../overlay/Header";
import ColumnEditorOverlay from "../overlay/ColumnEditorOverlay";

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

  saveEdit = () => {
    const {langtag, column: {id}} = this.props;
    const {name, description} = this.state;
    const new_name = (name !== this.props.name) ? trim(name) : null;
    const new_desc = (description !== this.props.description) ? trim(description) : null;
    ActionCreator.editColumnHeaderDone(id, langtag, new_name, new_desc);
  };

  editColumn = () => {
    const {description, column: {id}, column, langtag} = this.props;
    const name = column.displayName[langtag] || column.name;

    const buttons = {
      positive: [i18n.t("common:save"), this.saveEdit],
      neutral: [i18n.t("common:cancel"), null]
    };

    ActionCreator.openOverlay({
      head: <Header context={i18n.t("table:editor.edit_column")}
                    title={name}
                    actions={buttons}
      />,
      body: <ColumnEditorOverlay name={name}
                                 handleInput={this.handleInput}
                                 description={description}
                                 index={id}
      />,
      //footer: <Footer actions={buttons} />,
      type: "normal"
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
    const {column} = this.props;

    return (
      <ColumnContextMenu closeHandler={this.closeContextMenu}
                         editHandler={this.editColumn}
                         column={column}
                         langtag={this.props.langtag}
                         popupToggleButtonId={this.calcId()}
                         isId={this.props.isId}
      />
    );
  };

  render = () => {
    const {column: {kind, id}, columnContent, columnIcon} = this.props;
    const menu_open = this.state.ctxCoords;
    const contextmenu_css_class = classNames(
      "column-contextmenu-button fa ", {
        "fa-angle-up": menu_open,
        "fa-angle-down": !menu_open
      });
    classNames("column-head", {"context-menu-open": menu_open});
    return (
      <div className={classNames("column-head", {"context-menu-open": menu_open})}
           key={id}>
        <div className={classNames("column-name-wrapper", {"column-link-wrapper": kind === "link"})}>
          {columnContent}
          {columnIcon}
        </div>
        {(kind !== "concat")
          ? <a href="#" className={contextmenu_css_class} id={this.calcId()}
             onClick={this.toggleContextMenu}>
          </a>
          : null}
        {(menu_open) ? this.renderContextMenu() : null}
      </div>
    );
  }
}

ColumnEntry.PropTypes = {
  description: React.PropTypes.string.isRequired,
  columnContent: React.PropTypes.array.isRequired,
  selected: React.PropTypes.number.isRequired,
  cancelEdit: React.PropTypes.func.isRequired,
  langtag: React.PropTypes.string.isRequired,
  column: React.PropTypes.object.isRequired,
  name: React.PropTypes.string.isRequired,
  isId: React.PropTypes.bool.isRequired
};

module.exports = ColumnEntry;
