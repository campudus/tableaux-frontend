import React, { Component } from "react";
import PropTypes from "prop-types";
import "react-virtualized/styles.css";
import SvgIcon from "../../helperComponents/SvgIcon";
import { DragDropContext, DragSource, DropTarget } from "react-dnd";
import HTML5Backend from "react-dnd-html5-backend";
import classNames from "classnames";
import f from "lodash/fp";
import { compose, withStateHandlers, lifecycle } from "recompose";

const ItemType = "item-type";

const itemSource = {
  beginDrag(props) {
    return {
      id: props.id,
      index: props.index
    };
  },
  endDrag(props) {
    props.applySwap();
  }
};

const itemTarget = {
  hover(props, monitor) {
    const dragIndex = monitor.getItem().index;
    const hoverIndex = props.index;

    if (dragIndex === hoverIndex) {
      return;
    }

    props.swapOrdering(dragIndex, hoverIndex);
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
    const {
      isDragging,
      connectDragSource,
      connectDropTarget,
      connectDragPreview,
      isHovered
    } = this.props;
    const itemClass = classNames("draggable", {
      "is-dragging": isDragging,
      "is-hovered": isHovered
    });
    return connectDragPreview(
      connectDropTarget(
        <div className={itemClass}>
          {connectDragSource(
            <div className="drag-handle">
              <SvgIcon icon="burger" />
            </div>
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
    entries: PropTypes.array.isRequired,
    renderListItem: PropTypes.func.isRequired
  };

  render() {
    const {
      renderListItem,
      swapItems,
      ordering,
      swapOrdering,
      applySwap,
      wrapperClass
    } = this.props;

    return (
      <div className={wrapperClass /*link-list*/}>
        {ordering.map((item, idx) => (
          <DragItem
            key={item.id}
            index={idx}
            swapItems={swapItems}
            applySwap={applySwap(ordering)}
            swapOrdering={swapOrdering}
          >
            {renderListItem({
              index: item.idx,
              key: item.id
            })}
          </DragItem>
        ))}
      </div>
    );
  }
}

export default compose(
  withStateHandlers(
    { ordering: [] },
    {
      setOrdering: () => ordering => ({
        ordering
      }),
      swapOrdering: ({ ordering }) => (dragIndex, hoverIndex) => {
        if (dragIndex > hoverIndex) {
          const first = f.slice(0, hoverIndex, ordering);
          const element = ordering[dragIndex];
          const second = f.pull(
            element,
            f.slice(hoverIndex, ordering.length, ordering)
          );
          return { ordering: [...first, element, ...second] };
        } else {
          const first = f.slice(0, dragIndex, ordering);
          const element = ordering[hoverIndex];
          const second = f.pull(
            element,
            f.slice(dragIndex, ordering.length, ordering)
          );
          return { ordering: [...first, element, ...second] };
        }
      }
    }
  ),
  lifecycle({
    componentWillMount() {
      this.props.setOrdering(this.props.entries);
    },
    componentWillReceiveProps(nextProps) {
      const getEntries = f.getOr([], ["entries"]);
      if (getEntries(this.props).length !== getEntries(nextProps).length) {
        this.props.setOrdering(this.props.entries);
      }
    }
  })
)(DragSortList);
