import React, { useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Action from "../redux/actionCreators";
import { selectShowArchivedState } from "../redux/reducers/tableView";

const ToggleArchivedRowsButton = ({ table }) => {
  // prevent potential massive reload of archived rows
  const [mustFetchArchivedRows, setMustFetchArchivedRows] = useState(true);

  const showArchived = useSelector(selectShowArchivedState);
  const dispatch = useDispatch();
  const className = `filter-wrapper ${showArchived ? "active" : ""}`;
  const toggleArchivedRows = useCallback(() => {
    if (mustFetchArchivedRows) {
      dispatch(Action.loadAllRows(table.id, true));
      setMustFetchArchivedRows(false);
    }
    dispatch(Action.setShowArchivedRows(table, !showArchived));
  }, [showArchived, mustFetchArchivedRows]);

  return (
    <div className={className}>
      <button className="filter-popup-button" onClick={toggleArchivedRows}>
        <i className="fa fa-archive" />
      </button>
    </div>
  );
};

export default ToggleArchivedRowsButton;
