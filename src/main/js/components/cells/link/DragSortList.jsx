import React, {Component, PropTypes} from "react";
import "react-virtualized/styles.css";
import SvgIcon from "../../helperComponents/SvgIcon";
import {DragDropContext, DragSource, DropTarget} from "react-dnd";
import HTML5Backend from "react-dnd-html5-backend";
import classNames from "classnames";

const ItemType = Symbol("item-type");

const itemSource = {
  beginDrag(props) {
    return {
      id: props.id,
      index: props.index
    };
  }
};

const itemTarget = {
  hover(props, monitor, component) {
    const dragIndex = monitor.getItem().index;
    const hoverIndex = props.index;

    if (dragIndex === hoverIndex) {
      return;
    }
    props.swapItems(dragIndex, hoverIndex);
    monitor.getItem().index = hoverIndex;
  }
};

@DropTarget(ItemType, itemTarget, (connect, monitor) => ({
  connectDropTarget: connect.dropTarget(),
  isHovered: monitor.isOver()
}))
@DragSource(ItemType, itemSource, (connect, monitor) => ({
  connectDragSource: connect.dragSource(),
  connectDragPreview: connect.dragPreview(),
  isDragging: monitor.isDragging()
}))
class DragItem extends Component {
  render() {
    const {isDragging, connectDragSource, connectDropTarget, connectDragPreview, isHovered} = this.props;
    const itemClass = classNames("draggable", {
      "is-dragging": isDragging,
      "is-hovered": isHovered
    });
    return connectDragPreview(
      connectDropTarget(
        <div className={itemClass} >
          {connectDragSource(
            <div className="drag-handle"><SvgIcon icon="burger" /></div>
          )}
          {this.props.children}
        </div>
      )
    );
  }
}

@DragDropContext(HTML5Backend)
class DragSortList extends Component {
  static propTypes = {
    items: PropTypes.array.isRequired,
    renderListItem: PropTypes.func,
    swapItems: PropTypes.func
  };

  render() {
    const {renderListItem, swapItems, items} = this.props;
    return (
      <div className="link-list">
        {
          items.map(
            (item, idx) => (
              <DragItem key={idx}
                        index={idx}
                        swapItems={swapItems}
              >
                {renderListItem({
                  index: item.index,
                  key: idx
                })}
              </DragItem>
            )
          )
        }
      </div>
    );
  }
}

export default DragSortList;
