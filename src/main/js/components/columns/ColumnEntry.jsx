/*
 * Entries for the table header.
 * In non-admin mode displays the header text/icon representation. If user has admin rights, rows may be selected
 * on click, second click sends Action event to open overlay to edit current header's title and description.
 */
import React from "react";
import ReactDOM from "react-dom";
import ActionCreator from "../../actions/ActionCreator";
import i18n from "i18next";
import ColumnContextMenu from "../../components/contextMenu/ColumnContextMenu";
import classNames from "classnames";
import Header from "../overlay/Header";
import ColumnEditorOverlay from "../overlay/ColumnEditorOverlay";
import * as f from "lodash/fp";
import Portal from "react-portal";

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
      <Portal closeOnOutsideClick isOpened >
        <ColumnContextMenu closeHandler={this.closeContextMenu}
                           editHandler={this.editColumn}
                           column={column}
                           langtag={this.props.langtag}
                           isId={this.props.isId}
                           tables={this.props.tables}
                           rect={this.state.ctxCoords}
        />
      </Portal>
    );
  };

  showDescription = (show) => (event) => {
    const headerNode = ReactDOM.findDOMNode(event.target);
    this.setState({
      showDescription: show && !f.isEmpty(this.props.description),
      descriptionCoords: (show) ? headerNode.getBoundingClientRect() : null
    });
  };

  componentDidUpdate() {
    if (!this.tooltip) {
      return;
    }

    const domNode = ReactDOM.findDOMNode(this.tooltip);
    const nodeRect = domNode.getBoundingClientRect();
    const nodeRight = nodeRect.right;
    const windowWidth = window.innerWidth;

    if (nodeRight > (windowWidth - 10)) {
      domNode.classList.add("shift-left");
    }
  }

  render = () => {
    const {column: {kind, id}, columnContent, columnIcon, description} = this.props;
    const menuOpen = this.state.ctxCoords;
    const showDescription = !f.isEmpty(description) && this.state.showDescription && !menuOpen;
    const {left, bottom} = (showDescription) ? this.state.descriptionCoords : {};
    const contextMenuClass = classNames(
      "column-contextmenu-button fa ", {
        "fa-angle-up ignore-react-onclickoutside": menuOpen,
        "fa-angle-down": !menuOpen
      });
    classNames("column-head", {"context-menu-open": menuOpen});
    return (
      <div style={this.props.style}
           className={classNames("column-head", {"context-menu-open": menuOpen})}
           key={id}
      >
        <div className={classNames("column-name-wrapper", {"column-link-wrapper": kind === "link"})}
             onMouseEnter={this.showDescription(true)}
             onMouseLeave={this.showDescription(false)}
        >
          {columnContent}
          {!f.isEmpty(description) ? <i className="description-hint fa fa-info-circle"/> : null }
          {columnIcon}
        </div>
        {(showDescription)
          ? (
            <Portal isOpened>
              <div className="description-tooltip"
                   ref={el => { this.tooltip = el; }}
                   style={{ // align top left corner at bottom left corner of opening div
                     left: left,
                     top: bottom + 10
                   }}
              >
                <div className="description-tooltip-text">{description}</div>
              </div>
            </Portal>
          )
          : null}
        {(kind !== "concat")
          ? <a href="#" className={contextMenuClass}
               onClick={this.toggleContextMenu}
          />
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
