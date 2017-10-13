import React from "react";
import * as TableHistory from "./tableHistory";
import f from "lodash/fp";
import Dispatcher from "../../../dispatcher/Dispatcher";
import {ActionTypes} from "../../../constants/TableauxConstants";
import {compose, lifecycle} from "recompose";

const HistoryButtons = (props) => (
  <div className="history-buttons">
    <a className={`button undo-button ${(TableHistory.canUndo()) ? "" : "disabled"}`}
       onClick={(TableHistory.canUndo()) ? TableHistory.undo : f.noop}
       href="#"
       draggable={false}
    >
      <i className="fa fa-undo" />
    </a>
    <a className={`button redo-button ${(TableHistory.canRedo()) ? "" : "disabled"}`}
       onClick={(TableHistory.canRedo()) ? TableHistory.redo : f.noop}
       href="#"
       draggable={false}
    >
      <i className="fa fa-repeat" />
    </a>
  </div>
);

export default compose(
  lifecycle({
    componentDidMount() {
      Dispatcher.on(ActionTypes.BROADCAST_DATA_CHANGE, this.forceUpdate);
      Dispatcher.on(ActionTypes.SWITCH_TABLE, this.forceUpdate);
    },
    componentWillUnmount() {
      Dispatcher.off(ActionTypes.BROADCAST_DATA_CHANGE, this.forceUpdate);
      Dispatcher.off(ActionTypes.SWITCH_TABLE, this.forceUpdate);
    }
  })
)(HistoryButtons);
