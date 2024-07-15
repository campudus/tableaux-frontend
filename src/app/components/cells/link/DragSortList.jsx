import React from "react";
import PropTypes from "prop-types";
import SvgIcon from "../../helperComponents/SvgIcon";
import { Container, Draggable } from "react-smooth-dnd";
import { dragReorder } from "./dragHelper";
import f from "lodash/fp";

const DragSortList = ({
  entries,
  onReorder,
  renderListItem,
  rowsToRender,
  wrapperClass
}) => {
  const handleReorder = ({
    removedIndex, // Index of item dragged
    addedIndex // Index where item was dropped
  }) => {
    const reordered = dragReorder(removedIndex, addedIndex, entries);
    if (!f.equals(entries, reordered)) {
      onReorder(reordered);
    }
  };

  return (
    <div className={wrapperClass}>
      <Container
        dragHandleSelector=".drag-handle"
        onDrop={handleReorder}
        lockAxis="y"
      >
        {f.take(rowsToRender ?? entries.length, entries).map((id, idx) => (
          <DragItem key={`${id}-${idx}`}>
            {renderListItem({ index: idx, key: id })}
          </DragItem>
        ))}
      </Container>
    </div>
  );
};

const DragItem = ({ children }) => (
  <Draggable className="draggable">
    <div className="drag-handle">
      <SvgIcon icon="burger"></SvgIcon>
    </div>
    {children}
  </Draggable>
);
DragSortList.propTypes = {
  entries: PropTypes.array.isRequired,
  onReorder: PropTypes.func.isRequired,
  renderListItem: PropTypes.func.isRequired,
  rowsToRender: PropTypes.number,
  wrapperClass: PropTypes.string
};

export default DragSortList;
