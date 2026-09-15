import classNames from "classnames";
import { ReactElement } from "react";
import { showsOnlyPlaceholders } from "../../../helpers/groupDisplayValue";
import { isLocked } from "../../../helpers/rowUnlock";
import { Cell } from "../../../types/grud";
import GroupDisplayValue from "../../helperComponents/GroupDisplayValue";
import { openEntityView } from "../../overlay/EntityViewOverlay";

type GroupCellProps = {
  cell: Cell;
  editing: boolean;
  selected: boolean;
  langtag: string;
};

export default function GroupCell({
  cell,
  editing,
  selected,
  langtag
}: GroupCellProps): ReactElement {
  const openEditor = () => {
    if ((selected || editing) && !isLocked(cell.row)) {
      openEntityView({
        langtag,
        table: cell.table,
        row: cell.row,
        filterColumn: cell.column
      });
    }
  };

  const className = classNames("cell-content", {
    "grey-out": showsOnlyPlaceholders(cell.column, cell.value, langtag)
  });

  return (
    <div className={className} onClick={openEditor}>
      <GroupDisplayValue
        column={cell.column}
        value={cell.value}
        langtag={langtag}
      />
    </div>
  );
}
