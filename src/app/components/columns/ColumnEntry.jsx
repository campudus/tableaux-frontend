import { Rnd } from "react-rnd";
import React from "react";
import ReactDOM from "react-dom";
import f from "lodash/fp";
import i18n from "i18next";

import PropTypes from "prop-types";
import classNames from "classnames";

import { ColumnKinds } from "../../constants/TableauxConstants";
import {
  ContextMenu,
  ContextMenuButton,
  DescriptionTooltip
} from "./ColumnHeaderFragments";
import { canUserEditColumnDisplayProperty } from "../../helpers/accessManagementHelper";
import ColumnEditorOverlay from "../overlay/ColumnEditorOverlay";
import Header from "../overlay/Header";

export default class ColumnEntry extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      displayValue: f.get(["column", "displayName"], props),
      description: f.get(["column", "description"], props),
      contextMenu: null,
      showDescription: false
    };
  }

  handleInput = ({ displayValue, description }) => {
    const { langtag } = this.props;
    this.setState(
      f.compose(
        f.assoc(["displayValue", langtag], displayValue),
        f.assoc(["description", langtag], description)
      )
    );
  };

  saveEdit = () => {
    const {
      langtag,
      column: { id, displayName },
      column,
      actions: { editColumn },
      tableId
    } = this.props;
    const [displayValue, description] = f.props(
      [["displayValue", langtag], ["description", langtag]],
      this.state
    );
    if (
      displayValue !== f.prop(["displayValue", langtag], column) ||
      description !== (["description", langtag], column)
    )
      editColumn(id, tableId, {
        displayName: { ...displayName, [langtag]: f.trim(displayValue) },
        description: { ...column.description, [langtag]: f.trim(description) }
      });
  };

  editColumn = () => {
    const {
      column,
      langtag,
      actions: { openOverlay }
    } = this.props;
    const name = column.displayName[langtag] || column.name;

    const [displayValue, description] = f.props(
      [["displayValue", langtag], ["description", langtag]],
      this.state
    );
    const buttons = {
      positive: [i18n.t("common:save"), this.saveEdit],
      neutral: [i18n.t("common:cancel"), null]
    };

    openOverlay({
      head: (
        <Header
          context={i18n.t("table:editor.edit_column")}
          title={name}
          buttonActions={buttons}
        />
      ),
      body: (
        <ColumnEditorOverlay
          columnName={displayValue}
          description={description}
          handleInput={this.handleInput}
          langtag={langtag}
        />
      ),
      type: "normal"
    });
  };

  openContextMenu = evt => {
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
    this.setState({ ctxCoords: null });
  };

  toggleContextMenu = evt => {
    this.state.ctxCoords ? this.closeContextMenu() : this.openContextMenu(evt);
    evt.preventDefault();
  };

  showDescription = show => event => {
    // need real dom node here
    // eslint-disable-next-line react/no-find-dom-node
    const headerNode = ReactDOM.findDOMNode(event.target);
    this.setState({
      showDescription: show && !f.isEmpty(this.props.description),
      descriptionCoords: show ? headerNode.getBoundingClientRect() : null
    });
  };

  componentDidUpdate() {
    if (!this.tooltip) {
      return;
    }

    // need real dom node here
    // eslint-disable-next-line react/no-find-dom-node
    const domNode = ReactDOM.findDOMNode(this.tooltip);
    const nodeRect = domNode.getBoundingClientRect();
    const nodeRight = nodeRect.right;
    const windowWidth = window.innerWidth;

    if (nodeRight > windowWidth - 10) {
      domNode.classList.add("shift-left");
    }
  }

  resize = (event, direction, ref, delta) => {
    const { index, resizeHandler } = this.props;
    resizeHandler(index, delta.width);
  };

  setToolTipRef = node => {
    this.tooltip = node;
  };

  render() {
    const {
      column,
      langtag,
      column: { kind, id },
      columnContent,
      columnIcon,
      description,
      resizeFinishedHandler,
      actions,
      navigate,
      toTable
    } = this.props;
    const menuOpen = this.state.ctxCoords;
    const showDescription =
      !f.isEmpty(description) && this.state.showDescription && !menuOpen;
    const { left, bottom } = showDescription
      ? this.state.descriptionCoords
      : {};
    const contextMenuClass = classNames("column-contextmenu-button fa ", {
      "fa-angle-up ignore-react-onclickoutside": menuOpen,
      "fa-angle-down": !menuOpen
    });
    classNames("column-head", { "context-menu-open": menuOpen });
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
          className={classNames("column-head", {
            "context-menu-open": menuOpen
          })}
          key={id}
        >
          <div
            className={classNames("column-name-wrapper", {
              "column-link-wrapper": kind === "link"
            })}
            onMouseEnter={this.showDescription(true)}
            onMouseLeave={this.showDescription(false)}
          >
            {columnContent}
            {!f.isEmpty(description) ? (
              <i className="description-hint fa fa-info-circle" />
            ) : null}
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
            editHandler={
              canUserEditColumnDisplayProperty({ column })
                ? this.editColumn
                : null
            }
            column={column}
            langtag={langtag}
            isId={this.props.isId}
            tables={this.props.tables}
            rect={this.state.ctxCoords}
            actions={actions}
            navigate={navigate}
            toTable={toTable}
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
