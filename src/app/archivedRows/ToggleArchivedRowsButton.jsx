import React, { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import Action from "../redux/actionCreators";
import { selectShowArchivedState } from "../redux/reducers/tableView";

const ToggleArchivedRowsButton = ({ table }) => {
  const showArchived = useSelector(selectShowArchivedState);
  const dispatch = useDispatch();
  const className = `filter-wrapper ${showArchived ? "active" : ""}`;
  const toggleArchivedRows = useCallback(() => {
    dispatch(Action.setShowArchivedRows(table, !showArchived));
  }, [showArchived]);

  return (
    <div className={className}>
      <button className="filter-popup-button" onClick={toggleArchivedRows}>
        <i className="fa fa-archive" />
      </button>
    </div>
  );
};

export default ToggleArchivedRowsButton;
