import React, { useState } from "react";

import PropTypes from "prop-types";
import {
  ContextMenuButton,
  ContextMenu
} from "../columns/ColumnHeaderFragments";
import classNames from "classnames";

const MetaCellHeader = ({ displayName, column }) => {
  const [ctxCoords, setCtxCoords] = useState(null);
  const menuOpen = !!ctxCoords;

  const openContextMenu = evt => {
    if (!evt) {
      return;
    }
    const parentNode = evt.target.parentNode;
    const rect = parentNode.getBoundingClientRect();
    setCtxCoords({
      x: rect.left,
      y: rect.bottom
    });
  };

  const closeContextMenu = () => {
    setCtxCoords(null);
  };

  const toggleContextMenu = evt => {
    ctxCoords ? closeContextMenu() : openContextMenu(evt);
    evt.preventDefault();
  };

  return (
    <div
      className={classNames("meta-cell-head", {
        "context-menu-open": menuOpen
      })}
    >
      {displayName}
      <ContextMenuButton
        contextMenuClass={classNames("column-contextmenu-button fa ", {
          "fa-angle-up ignore-react-onclickoutside": menuOpen,
          "fa-angle-down": !menuOpen
        })}
        toggleContextMenu={toggleContextMenu}
      />
      <ContextMenu
        menuOpen={menuOpen}
        column={column}
        closeHandler={closeContextMenu}
        isId={true}
        rect={ctxCoords}
        alignRight={true}
      />
    </div>
  );
};

MetaCellHeader.propTypes = {
  displayName: PropTypes.string.isRequired,
  column: PropTypes.object.isRequired
};

export default MetaCellHeader;
