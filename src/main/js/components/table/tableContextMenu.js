import React from 'react';
import RowContextMenu from './../contextMenu/RowContextMenu';
import listensToClickOutside from '../../../../../node_modules/react-onclickoutside/decorator';

const RowContextMenuWithClickOutside = listensToClickOutside(RowContextMenu);

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
      onClickOutside={()=>{this.setState({rowContextMenu : null})}}
      offsetY={this.tableDOMOffsetY}/>
  } else {
    return null;
  }
}