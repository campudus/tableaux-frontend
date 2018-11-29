import React from "react";
import {Portal} from "react-portal";
import ColumnContextMenu from "../../components/contextMenu/ColumnContextMenu";
import {branch, renderNothing} from "recompose";

export const DescriptionTooltip = branch(
  (props) => !props.showDescription,
  renderNothing,
)(
  (props) => (
    <Portal isOpened>
      <div
        className="description-tooltip"
        ref={props.setToolTipRef}
        style={{ // align top left corner at bottom left corner of opening div
          left: props.left,
          top: props.bottom + 10
        }}
      >
        <div className="description-tooltip-text">{props.description}</div>
      </div>
    </Portal>
  )
);

export const ContextMenuButton = branch(
  (props) => props.isConcat,
  renderNothing
)(
  (props) => (
    <a
      href="#"
      className={props.contextMenuClass}
      draggable={false}
      onClick={props.toggleContextMenu}
    />
  )
);

export const ContextMenu = branch(
  (props) => !props.menuOpen,
  renderNothing
)(
  (props) => (
    <Portal closeOnOutsideClick isOpened>
      <ColumnContextMenu {...props} />
    </Portal>
  )
);
