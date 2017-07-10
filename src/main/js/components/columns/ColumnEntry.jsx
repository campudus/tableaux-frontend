/*
 * Entries for the table header.
 * In non-admin mode displays the header text/icon representation. If user has admin rights, rows may be selected
 * on click, second click sends Action event to open overlay to edit current header's title and description.
 */
import React from "react";
import ActionCreator from "../../actions/ActionCreator";
import i18n from "i18next";
import ColumnContextMenu from "../../components/contextMenu/ColumnContextMenu";
import classNames from "classnames";
import Header from "../overlay/Header";
import ColumnEditorOverlay from "../overlay/ColumnEditorOverlay";
import * as f from "lodash/fp";

class ColumnEntry extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      name: this.props.name,
      description: this.props.description,
      contextMenu: null,
      showDescription: false
    };
  }

  calcId = () => "column-context-menu-" + JSON.stringify(this.props.column.id);

  handleInput = (inputState) => {
    this.setState(inputState);
  };

  saveEdit = () => {
    const {langtag, column: {id}} = this.props;
    const {name, description} = this.state;
    const newName = (name !== this.props.name) ? f.trim(name) : null;
    const newDesc = (description !== this.props.description) ? f.trim(description) : null;
    ActionCreator.editColumnHeaderDone(id, langtag, newName, newDesc);
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
      type: "normal"
    });
  };

  openContextMenu = (evt) => {
    if (!evt) {
      return;
    }
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
                         tables={this.props.tables}
      />
    );
  };

  showDescription = (show) => () => {
    this.setState({showDescription: show && !f.isEmpty(this.props.description)});
  };

  render = () => {
    const {column: {kind, id}, columnContent, columnIcon, description} = this.props;
    const menuOpen = this.state.ctxCoords;
    const showDescription = !f.isEmpty(description) && this.state.showDescription && !menuOpen;
    const contextMenuClass = classNames(
      "column-contextmenu-button fa ", {
        "fa-angle-up": menuOpen,
        "fa-angle-down": !menuOpen
      });
    classNames("column-head", {"context-menu-open": menuOpen});
    return (
      <div className={classNames("column-head", {"context-menu-open": menuOpen})}
           key={id}
      >
        <div className={classNames("column-name-wrapper", {"column-link-wrapper": kind === "link"})}
             onMouseEnter={this.showDescription(true)}
             onMouseLeave={this.showDescription(false)}
        >
          {columnContent}
          {columnIcon}
        </div>
        {(showDescription)
          ? (
            <div className="description-tooltip"
            >
              <div className="description-tooltip-text">{description}</div>
            </div>
          )
          : null}
        {(kind !== "concat")
          ? <a href="#" className={contextMenuClass} id={this.calcId()}
               onClick={this.toggleContextMenu}>
          </a>
          : null}
        {(menuOpen) ? this.renderContextMenu() : null}
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
  isId: React.PropTypes.bool.isRequired,
  tables: React.PropTypes.object.isRequired
};

module.exports = ColumnEntry;
