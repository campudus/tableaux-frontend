import React from "react";
import PropTypes from "prop-types";
import f from "lodash/fp";
import { compose, lifecycle, withStateHandlers } from "recompose";
import classNames from "classnames";

const HistoryButtons = ({ canUndo, canRedo, undo, redo, active }) => {
  const buttonBaseClass = classNames("button", { inactive: !active });

  return (
    <div className="history-buttons">
      <a
        className={`${buttonBaseClass} undo-button ${
          canUndo ? "" : "disabled"
        }`}
        onClick={canUndo ? undo : f.noop}
        href="#"
        draggable={false}
      >
        <i className="fa fa-undo" />
      </a>
      <a
        className={`${buttonBaseClass} redo-button ${
          canRedo ? "" : "disabled"
        }`}
        onClick={canRedo ? redo : f.noop}
        href="#"
        draggable={false}
      >
        <i className="fa fa-repeat" />
      </a>
    </div>
  );
};

const hasElements = (props, queueName) => {
  const rowSpecific = !f.isNil(props.rowId);
  const filterFunc = rowSpecific
    ? f.overEvery([
        f.propEq("tableId", props.tableId),
        f.propEq("rowId", props.rowId)
      ])
    : f.propEq("tableId", props.tableId);

  return f.flow(
    f.get(["tableView", "history", queueName]),
    f.filter(filterFunc),
    f.negate(f.isEmpty)
  )(props);
};

export default compose(
  withStateHandlers(
    props => ({
      canUndo: hasElements(props, "undoQueue"),
      canRedo: hasElements(props, "redoQueue"),
      active: true
    }),
    {
      updateButtonState: (state, props) => () => {
        return {
          canUndo: hasElements(props, "undoQueue"),
          canRedo: hasElements(props, "redoQueue"),
          active: true
        };
      },
      undo: (
        { active },
        { actions: { modifyHistory }, tableId, rowId }
      ) => () => {
        if (active) {
          modifyHistory("undo", tableId, rowId);
          return { active: false };
        }
      },
      redo: (
        { active },
        { actions: { modifyHistory }, tableId, rowId }
      ) => () => {
        if (active) {
          modifyHistory("redo", tableId, rowId);
          return { active: false };
        }
      }
    }
  ),
  lifecycle({
    componentDidUpdate(prevProps) {
      const historyOf = f.prop("tableView.history");
      const historyChanged = !f.eq(historyOf(prevProps), historyOf(this.props));
      const rowChanged = prevProps.rowId !== this.props.rowId;

      if (historyChanged || rowChanged) {
        this.props.updateButtonState();
      }
    }
  })
)(HistoryButtons);

HistoryButtons.propTypes = {
  actions: PropTypes.object.isRequired,
  tableView: PropTypes.object.isRequired,
  tableId: PropTypes.number.isRequired,
  rowId: PropTypes.number
};
