import React from "react";
import PropTypes from "prop-types";
import { openEntityView } from "../../overlay/EntityViewOverlay";
import GroupDisplayValue from "../../helperComponents/GroupDisplayValue";

const GroupView = props => {
  const { langtag, cell, thisUserCantEdit, funcs } = props;

  const clickHandler = evt => {
    if (thisUserCantEdit) {
      return;
    }
    evt.stopPropagation();
    openEntityView({
      langtag,
      table: cell.table,
      row: cell.row,
      filterColumn: cell.column
    });
  };

  return (
    <div
      className="item-content group"
      tabIndex="1"
      ref={el => {
        funcs.register(el);
      }}
      onClick={clickHandler}
    >
      <GroupDisplayValue
        column={cell.column}
        value={cell.value}
        langtag={langtag}
      />
      {props.children}
    </div>
  );
};

GroupView.propTypes = {
  langtag: PropTypes.string.isRequired,
  cell: PropTypes.object.isRequired,
  funcs: PropTypes.object.isRequired,
  thisUserCantEdit: PropTypes.bool
};

export default GroupView;
