import React from "react";
import ReactDOM from "react-dom";
import ActionCreator from "../../actions/ActionCreator";
import i18n from "i18next";
import classNames from "classnames";
import Header from "../overlay/Header";
import ColumnEditorOverlay from "../overlay/ColumnEditorOverlay";
import * as f from "lodash/fp";
import Rnd from "react-rnd";
import PropTypes from "prop-types";
import {ContextMenu, ContextMenuButton, DescriptionTooltip} from "./ColumnHeaderFragments";
import {ColumnKinds} from "../../constants/TableauxConstants";

class ColumnEntry extends React.PureComponent {
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
      neutral: [i18n.t("common:cancel"), f.noop]
    };

    ActionCreator.openOverlay({
      head: <Header
        context={i18n.t("table:editor.edit_column")}
        title={name}
        actions={buttons}
      />,
      body: <ColumnEditorOverlay
        name={name}
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

  resize = (event, direction, ref, delta) => {
    const {index, resizeHandler} = this.props;
    resizeHandler(index, delta.width);
  };

  setToolTipRef = (node) => {
    this.tooltip = node;
  };

  render = () => {
    const {column, langtag, column: {kind, id}, columnContent, columnIcon, description, resizeFinishedHandler} = this.props;
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
      <Rnd
        style={this.props.style}
        default={{
          x: 0,
          y: 0,
          width: this.props.width,
          height: 37
        }}
        minWidth={100}
        enableResizing={{
          bottom: false,
          bottomLeft: false,
          bottomRight: false,
          left: false,
          right: this.props.index !== 1,
          top: false,
          topLeft: false,
          topRight: false
        }}
        disableDragging
        onResizeStop={resizeFinishedHandler}
        onResize={this.resize}
      >
        <div
          className={classNames("column-head", {"context-menu-open": menuOpen})}
          key={id}
        >
          <div
            className={classNames("column-name-wrapper", {"column-link-wrapper": kind === "link"})}
            onMouseEnter={this.showDescription(true)}
            onMouseLeave={this.showDescription(false)}
          >
            {columnContent}
            {!f.isEmpty(description) ? <i className="description-hint fa fa-info-circle" /> : null}
            {columnIcon}
          </div>
          <DescriptionTooltip
            showDescription={showDescription}
            description={description}
            setToolTipRef={this.setToolTipRef}
            left={left}
            bottom={bottom}
          />
          <ContextMenuButton
            isConcat={column.kind === ColumnKinds.concat}
            contextMenuClass={contextMenuClass}
            toggleContextMenu={this.toggleContextMenu}
          />
          <ContextMenu
            menuOpen={menuOpen}
            closeHandler={this.closeContextMenu}
            editHandler={this.editColumn}
            column={column}
            langtag={langtag}
            isId={this.props.isId}
            tables={this.props.tables}
            rect={this.state.ctxCoords}
          />
        </div>
      </Rnd>
    );
  }
}

ColumnEntry.propTypes = {
  description: PropTypes.string,
  columnContent: PropTypes.array.isRequired,
  langtag: PropTypes.string.isRequired,
  column: PropTypes.object.isRequired,
  name: PropTypes.string.isRequired,
  isId: PropTypes.bool.isRequired,
  tables: PropTypes.object.isRequired,
  resizeHandler: PropTypes.func.isRequired,
  resizeFinishedHandler: PropTypes.func.isRequired
};

module.exports = ColumnEntry;
