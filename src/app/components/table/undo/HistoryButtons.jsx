import React from "react";
import PropTypes from "prop-types";
import * as TableHistory from "./tableHistory";
import f from "lodash/fp";
import Dispatcher from "../../../dispatcher/Dispatcher";
import {ActionTypes} from "../../../constants/TableauxConstants";
import {compose, lifecycle, withStateHandlers} from "recompose";
import classNames from "classnames";

const HistoryButtons = ({history: {canUndo, canRedo}, undo, redo, active}) => {
  const buttonBaseClass = classNames("button", {inactive: !active});
  return (
    <div className="history-buttons">
      <a className={`${buttonBaseClass} undo-button ${(canUndo) ? "" : "disabled"}`}
         onClick={(canUndo) ? undo : f.noop}
         href="#"
         draggable={false}
      >
        <i className="fa fa-undo" />
      </a>
      <a className={`${buttonBaseClass} redo-button ${(canRedo) ? "" : "disabled"}`}
         onClick={(canRedo) ? redo : f.noop}
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
    (props) => ({
      history: {
        canUndo: TableHistory.canUndo({tableId: props.tableId, rowId: props.rowId}),
        canRedo: TableHistory.canRedo({tableId: props.tableId, rowId: props.rowId})
      },
      active: true
    }),
    {
      updateButtonState: (state, {tableId, rowId}) => () => ({
        history: {
          canUndo: TableHistory.canUndo({tableId, rowId}),
          canRedo: TableHistory.canRedo({tableId, rowId})
        },
        active: true
      }),
      undo: ({active}, {tableId, rowId}) => () => {
        if (active) {
          TableHistory.undo({tableId, rowId});
          return {active: false};
        }
      },
      redo: ({active}, {tableId, rowId}) => () => {
        if (active) {
          TableHistory.redo({tableId, rowId});
          return {active: false};
        }
      }
    }
  ),
  lifecycle({
    componentDidMount() {
      Dispatcher.on(ActionTypes.BROADCAST_UNDO_EVENT, this.props.updateButtonState);
    },
    componentWillUnmount() {
      Dispatcher.off(ActionTypes.BROADCAST_UNDO_EVENT, this.props.updateButtonState);
    },
    componentDidUpdate(prevProps) { // table switch
      if (this.props.tableId !== prevProps.tableId || this.props.rowId !== prevProps.rowId) {
        this.props.updateButtonState();
      }
    }
  })
)(HistoryButtons);

HistoryButtons.propTypes = {
  tableId: PropTypes.number.isRequired,
  rowId: PropTypes.number
};
