import React from "react";
import RowContextMenu from "./../contextMenu/RowContextMenu";
import onClickOutside from "react-onclickoutside";

const RowContextMenuWithClickOutside = onClickOutside(RowContextMenu);

export function showRowContextMenu(payload) {
  this.setState({
    rowContextMenu: payload
  });
}

export function closeRowContextMenu() {
  this.setState({
    rowContextMenu: null
  });
}

export function getRowContextMenu() {
  const { rowContextMenu } = this.state;
  if (rowContextMenu !== null) {
    return (
      <RowContextMenuWithClickOutside
        {...rowContextMenu}
        handleClickOutside={() => {
          this.setState({ rowContextMenu: null });
        }}
        pasteFrom={this.props.pasteOriginCell}
        offsetY={30}
        rows={this.props.rows}
      />
    );
  } else {
    return null;
  }
}
