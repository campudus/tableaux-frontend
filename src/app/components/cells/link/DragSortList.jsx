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
    // props.swapItems(dragIndex, hoverIndex);
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
    rowResults: PropTypes.object.isRequired,
    renderListItem: PropTypes.func.isRequired,
    swapItems: PropTypes.func.isRequired
  };

  render() {
    const {
      renderListItem,
      swapItems,
      rowResults: { linked },
      ordering,
      swapOrdering,
      applySwap
    } = this.props;
    const items = f
      .defaultTo([])(
        f.map(id => {
          const item = f.find(linkedItem => linkedItem.id === id, linked);
          return item;
        }, ordering)
      )
      .map((row = {}, index) => {
        return {
          index,
          id: row.id
        };
      });
    return (
      <div className="link-list">
        {items.map((item, idx) => (
          <DragItem
            key={idx}
            index={idx}
            swapItems={swapItems}
            applySwap={applySwap(ordering)}
            swapOrdering={swapOrdering}
          >
            {renderListItem({
              index: item.index,
              key: idx
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
        const rearranged = f.flow(
          f.assoc(dragIndex, f.get(hoverIndex, ordering)),
          f.assoc(hoverIndex, f.get(dragIndex, ordering))
        )(ordering);
        return { ordering: rearranged };
      }
    }
  ),
  lifecycle({
    componentWillReceiveProps(nextProps) {
      const getLinked = f.getOr([], ["rowResults", "linked"]);
      if (getLinked(this.props).length !== getLinked(nextProps).length) {
        this.props.setOrdering(f.map("id", nextProps.rowResults.linked));
      }
    }
  })
)(DragSortList);
