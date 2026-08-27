import { ReactElement } from "react";
import { GroupDisplayColumn } from "../../../helpers/groupDisplayValue";
import GroupDisplayValue from "../../helperComponents/GroupDisplayValue";

type GroupCellProps = {
  langtag: string;
  column: GroupDisplayColumn;
  value: unknown;
};

export default function GroupCell({
  langtag,
  column,
  value
}: GroupCellProps): ReactElement {
  return (
    <div className="group-cell">
      <GroupDisplayValue column={column} value={value} langtag={langtag} />
    </div>
  );
}
