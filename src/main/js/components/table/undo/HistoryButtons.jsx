import React from "react";
import * as TableHistory from "./tableHistory";
import f from "lodash/fp";
import Dispatcher from "../../../dispatcher/Dispatcher";
import {ActionTypes} from "../../../constants/TableauxConstants";
import {compose, lifecycle, withHandlers, withState} from "recompose";

const HistoryButtons = ({history: {canUndo, canRedo}}) => (
  <div className="history-buttons">
    <a className={`button undo-button ${(canUndo) ? "" : "disabled"}`}
       onClick={(canUndo) ? TableHistory.undo : f.noop}
       href="#"
       draggable={false}
    >
      <i className="fa fa-undo" />
    </a>
    <a className={`button redo-button ${(canRedo) ? "" : "disabled"}`}
       onClick={(canRedo) ? TableHistory.redo : f.noop}
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
    updateButtonState: ({setHistory}) => ({canUndo, canRedo}) => setHistory(f.always({
        canUndo,
        canRedo
      }))
  }),
  lifecycle({
    componentDidMount() {
      Dispatcher.on(ActionTypes.BROADCAST_UNDO_EVENT, this.props.updateButtonState);
      Dispatcher.on(ActionTypes.SWITCH_TABLE, this.props.updateButtonState);
    },
    componentWillUnmount() {
      Dispatcher.off(ActionTypes.BROADCAST_UNDO_EVENT, this.props.updateButtonState);
      Dispatcher.off(ActionTypes.SWITCH_TABLE, this.props.updateButtonState);
    }
  })
)(HistoryButtons);
