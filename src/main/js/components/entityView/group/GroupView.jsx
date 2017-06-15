import React, {PropTypes} from "react";
import {openEntityView} from "../../overlay/EntityViewOverlay";
import Empty from "../../helperComponents/emptyEntry";
import {isEmpty, trim} from "lodash/fp";

const GroupView = (props) => {
  const {langtag, cell, thisUserCantEdit, funcs} = props;

  const clickHandler = evt => {
    if (thisUserCantEdit) {
      return;
    }
    evt.stopPropagation();
    openEntityView(cell.row, langtag, null, [], cell.column);
  };

  const value = trim(cell.displayValue[langtag]);

  return (
    <div className="item-content group"
         tabIndex="1"
         ref={el => { funcs.register(el); }}
         onClick={clickHandler}
    >
      {(isEmpty(value)
      ? <Empty/>
      : value)}
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
