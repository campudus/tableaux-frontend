import React, {PropTypes} from "react";
import {openEntityView} from "../../overlay/EntityViewOverlay";

const GroupView = (props) => {
  const {langtag, cell, thisUserCantEdit, funcs} = props;

  const clickHandler = evt => {
    if (thisUserCantEdit) {
      return;
    }
    evt.stopPropagation();
    openEntityView(cell.row, langtag, null, [], cell.column);
  };

  return (
    <div className="item-content group"
         tabIndex="1"
         ref={el => { funcs.register(el); }}
         onClick={clickHandler}
    >
      <div className="concat-string">
        {cell.displayValue[langtag]}
      </div>
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
