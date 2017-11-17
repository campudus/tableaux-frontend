import React from "react";
import PropTypes from "prop-types";
import * as TableHistory from "./tableHistory";
import f from "lodash/fp";
import Dispatcher from "../../../dispatcher/Dispatcher";
import {ActionTypes} from "../../../constants/TableauxConstants";
import {compose, lifecycle, withHandlers, withState} from "recompose";

const HistoryButtons = ({history: {canUndo, canRedo}, undo, redo}) => (
  <div className="history-buttons">
    <a className={`button undo-button ${(canUndo) ? "" : "disabled"}`}
       onClick={(canUndo) ? undo : f.noop}
       href="#"
       draggable={false}
    >
      <i className="fa fa-undo" />
    </a>
    <a className={`button redo-button ${(canRedo) ? "" : "disabled"}`}
       onClick={(canRedo) ? redo : f.noop}
       href="#"
       draggable={false}
    >
      <i className="fa fa-repeat" />
    </a>
  </div>
);

export default compose(
  withState("history", "setHistory", {canUndo: false, canRedo: false}),
  withHandlers({
      updateButtonState: ({setHistory, tableId, rowId}) => () => {
        devLog("updateButtonState", tableId, rowId)
        setHistory(f.always({
          canUndo: TableHistory.canUndo({tableId, rowId}),
          canRedo: TableHistory.canRedo({tableId, rowId})
        }));
    },
    undo: ({tableId, rowId}) => () => TableHistory.undo({tableId, rowId}),
    redo: ({tableId, rowId}) => () => TableHistory.redo({tableId, rowId})
  }),
  lifecycle({
    componentDidMount() {
      Dispatcher.on(ActionTypes.BROADCAST_UNDO_EVENT, this.props.updateButtonState);
      this.props.updateButtonState();
    },
    componentWillUnmount() {
      Dispatcher.off(ActionTypes.BROADCAST_UNDO_EVENT, this.props.updateButtonState);
    },
    componentDidUpdate(prevProps) { // table switch
      if (this.props.tableId !== prevProps.tableId) {
        devLog("HistoryButtons: setting table to", prevProps.tableId)
        this.props.updateButtonState();
      }
    }
  })
)(HistoryButtons);

HistoryButtons.propTypes = {
  tableId: PropTypes.number.isRequired,
  rowId: PropTypes.number
};
