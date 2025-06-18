import classNames from "classnames";
import f from "lodash/fp";
import React, { useCallback } from "react";
import { useSelector } from "react-redux";
import { isRowArchived } from "../../archivedRows/helpers";
import { Langtags } from "../../constants/TableauxConstants";
import { canUserDeleteRow } from "../../helpers/accessManagementHelper";
import { getLanguageOrCountryIcon } from "../../helpers/multiLanguage";
import { initiateDeleteRow } from "../../helpers/rowHelper";

const MetaCell = ({
  expanded,
  langtag,
  row,
  table,
  toggleExpandedRow,
  isLocked
}) => {
  const { selectedCell = {} } = useSelector(store => store.selectedCell ?? {});
  const isInSelectedRow =
    row.id === selectedCell.rowId &&
    (f.isEmpty(langtag) || langtag === selectedCell.langtag);

  const handleToggleExpanded = useCallback(
    event => {
      event.stopPropagation();
      toggleExpandedRow();
    },
    [row.id, expanded]
  );
  const handleDeleteRow = useCallback(
    e => {
      e.stopPropagation();
      initiateDeleteRow({ table, row, langtag });
    },
    [table.id, row.id]
  );
  const cellClass = classNames("meta-cell", {
    "row-expanded": expanded,
    "in-selected-row": isInSelectedRow,
    archived: isRowArchived(row)
  });
  const isFinal = row.final;
  const userCanDeleteRow =
    !expanded && canUserDeleteRow({ table }) && !isFinal && isInSelectedRow;

  const Icon = isRowArchived(row) ? (
    <ArchivedIcon />
  ) : isFinal ? (
    <LockStatusIcon locked={isLocked} />
  ) : userCanDeleteRow ? (
    <DeleteRowButton onClick={handleDeleteRow} />
  ) : null;
  return (
    <div className={cellClass} onClick={handleToggleExpanded}>
      <div className="cell-content">
        {!expanded || langtag === Langtags[0] ? Icon : null}
        {expanded ? (
          getLanguageOrCountryIcon(langtag)
        ) : (
          <div className="meta-info-collapsed">
            <div className="row-number">{row.id}</div>
            <div className="row-expand">
              <i className="fa fa-chevron-down" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ArchivedIcon = () => <i className="fa fa-archive meta-cell-icon" />;

const LockStatusIcon = ({ locked }) => (
  <i className={`fa ${locked ? "fa-lock" : "fa-unlock"} meta-cell-icon`} />
);

const DeleteRowButton = ({ onClick }) => (
  <div className="delete-row">
    <button className="button" onClick={onClick}>
      <i className="fa fa-trash" />
    </button>
  </div>
);

export default MetaCell;
