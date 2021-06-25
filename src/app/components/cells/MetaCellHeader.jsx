import React from "react";

import PropTypes from "prop-types";
import {
  ContextMenuButton,
  ContextMenu
} from "../columns/ColumnHeaderFragments";
import classNames from "classnames";

class MetaCellHeader extends React.Component {
  static propTypes = {
    displayName: PropTypes.string.isRequired,
    column: PropTypes.object.isRequired
  };

  constructor(props) {
    super(props);

    this.state = {
      contextMenu: null
    };
  }

  openContextMenu = evt => {
    if (!evt) {
      return;
    }
    const parentNode = evt.target.parentNode;
    const rect = parentNode.getBoundingClientRect();
    this.setState({
      ctxCoords: {
        x: rect.left,
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

  render() {
    const { displayName, column } = this.props;
    const menuOpen = this.state.ctxCoords;
    const contextMenuClass = classNames("column-contextmenu-button fa ", {
      "fa-angle-up ignore-react-onclickoutside": menuOpen,
      "fa-angle-down": !menuOpen
    });

    return (
      <div
        className={classNames("meta-cell-head", {
          "context-menu-open": menuOpen
        })}
      >
        {displayName}
        <ContextMenuButton
          contextMenuClass={contextMenuClass}
          toggleContextMenu={this.toggleContextMenu}
        />
        <ContextMenu
          menuOpen={menuOpen}
          column={column}
          closeHandler={this.closeContextMenu}
          isId={true}
          rect={this.state.ctxCoords}
          alignRight={true}
        />
      </div>
    );
  }
}

export default MetaCellHeader;
