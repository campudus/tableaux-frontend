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

export default compose(
  withStateHandlers(
    props => ({
      canUndo: f.flow(
        f.get(["tableView", "history", "undoQueue"]),
        f.negate(f.isEmpty)
      )(props),
      canRedo: f.flow(
        f.get(["tableView", "history", "redoQueue"]),
        f.negate(f.isEmpty)
      )(props),
      active: true
    }),
    {
      updateButtonState: (state, props) => () => ({
        canUndo: f.flow(
          f.get(["tableView", "history", "undoQueue"]),
          f.filter(action => action.tableId === props.tableId),
          f.negate(f.isEmpty)
        )(props),
        canRedo: f.flow(
          f.get(["tableView", "history", "redoQueue"]),
          f.filter(action => action.tableId === props.tableId),
          f.negate(f.isEmpty)
        )(props),
        active: true
      }),
      undo: ({ active }, { actions: { modifyHistory }, tableId }) => () => {
        if (active) {
          modifyHistory("undo", tableId);
          return { active: false };
        }
      },
      redo: ({ active }, { actions: { modifyHistory }, tableId }) => () => {
        if (active) {
          modifyHistory("redo", tableId);
          return { active: false };
        }
      }
    }
  ),
  lifecycle({
    componentDidUpdate(prevProps) {
      // table switch
      const historyOf = f.prop("tableView.history");
      if (!f.eq(historyOf(prevProps), historyOf(this.props))) {
        this.props.updateButtonState();
      }
    }
  })
)(HistoryButtons);

HistoryButtons.propTypes = {
  tableId: PropTypes.number.isRequired,
  rowId: PropTypes.number
};
