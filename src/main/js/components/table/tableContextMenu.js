import React from "react";
import RowContextMenu from "./../contextMenu/RowContextMenu";
import onClickOutside from "react-onclickoutside";

const RowContextMenuWithClickOutside = onClickOutside(RowContextMenu);

export function showRowContextMenu(payload) {
  this.setState({
    rowContextMenu : payload
  });
}

export function closeRowContextMenu(payload) {
  this.setState({
    rowContextMenu : null
  });
}

export function getRowContextMenu() {
  const {rowContextMenu} = this.state;
  if (rowContextMenu !== null) {
    return <RowContextMenuWithClickOutside
      {...rowContextMenu}
      handleClickOutside={()=>{this.setState({rowContextMenu : null})}}
      pasteFrom={this.pasteOriginCell}
      offsetY={this.tableDOMOffsetY}/>
  } else {
    return null;
  }
}