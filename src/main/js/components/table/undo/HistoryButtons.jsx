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
    updateHistory: ({setHistory}) => () => window.requestAnimationFrame(() => setHistory(f.always({
      canUndo: TableHistory.canUndo(),
      canRedo: TableHistory.canRedo()
    })))
  }),
  lifecycle({
    componentDidMount() {
      Dispatcher.on(ActionTypes.BROADCAST_DATA_CHANGE, this.props.updateHistory);
      Dispatcher.on(ActionTypes.SWITCH_TABLE, this.props.updateHistory);
    },
    componentWillUnmount() {
      Dispatcher.off(ActionTypes.BROADCAST_DATA_CHANGE, this.props.updateHistory);
      Dispatcher.off(ActionTypes.SWITCH_TABLE, this.props.updateHistory);
    }
  })
)(HistoryButtons);
