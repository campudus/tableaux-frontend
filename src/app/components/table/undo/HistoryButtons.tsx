import f from "lodash/fp";
import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import actions from "../../../redux/actionCreators";
import { GRUDStore } from "../../../types/grud";

type History = GRUDStore["tableView"]["history"];
type HistoryAction = "undo" | "redo";

type HistoryButtonsProps = {
  history: History;
  tableId: number;
  rowId?: number;
};

export default function HistoryButtons({
  history,
  rowId,
  tableId
}: HistoryButtonsProps) {
  const { undoQueue, redoQueue } = history;
  const dispatch = useDispatch();
  const [isActive, setIsActive] = useState(true);
  const buttonClasses = "button small-button" + (!isActive ? " inactive" : "");
  const undoQueueEntries = f.filter(f.pickBy({ tableId, rowId }), undoQueue);
  const redoQueueEntries = f.filter(f.pickBy({ tableId, rowId }), redoQueue);
  const canUndo = isActive && !f.isEmpty(undoQueueEntries);
  const canRedo = isActive && !f.isEmpty(redoQueueEntries);

  const modifyHistory = (action: HistoryAction) => {
    return () => {
      dispatch(actions.modifyHistory(action, tableId, rowId));
      setIsActive(false);
    };
  };

  useEffect(() => {
    setIsActive(true);
  }, [history, rowId]);

  return (
    <div className="history-buttons">
      <button
        className={buttonClasses + (!canUndo ? " disabled" : "")}
        onClick={canUndo ? modifyHistory("undo") : f.noop}
      >
        <i className="fa fa-undo" />
      </button>
      <button
        className={buttonClasses + (!canRedo ? " disabled" : "")}
        onClick={canRedo ? modifyHistory("redo") : f.noop}
      >
        <i className="fa fa-repeat" />
      </button>
    </div>
  );
}
