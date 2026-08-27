import { ReactElement } from "react";
import {
  getGroupDisplayParts,
  GroupBooleanPart,
  GroupDisplayColumn
} from "../../helpers/groupDisplayValue";
import SvgIcon from "./SvgIcon";

// A boolean member of a group: a check or a cross plus the member's own name,
// in place of the bare display name a boolean contributes to a plain display
// value -- so a member that is switched off stays visible.
function GroupBoolean({ label, value }: GroupBooleanPart): ReactElement {
  return (
    <span className={`group-boolean group-boolean--${String(value)}`}>
      <SvgIcon
        icon={value ? "check" : "cross"}
        containerClasses={value ? "color-primary" : "color-medium-grey"}
      />
      {label}
    </span>
  );
}

type GroupDisplayValueProps = {
  column: GroupDisplayColumn;
  value: unknown;
  langtag: string;
};

// A group column's value, rendered from its member columns rather than from the
// group's display value string: the format pattern still decides order and
// separators, but boolean members become icons (see getGroupDisplayParts).
//
// Shared by the grid cell, the entity view and the preview, so all three read
// the same. `fallback` renders when nothing at all would show.
export default function GroupDisplayValue({
  column,
  value,
  langtag
}: GroupDisplayValueProps): ReactElement {
  const parts = getGroupDisplayParts(column, value, langtag);

  return (
    <span className="group-display-value">
      {parts.map(part =>
        typeof part === "string" ? (
          part
        ) : (
          <GroupBoolean
            key={part.label}
            label={part.label}
            value={part.value}
          />
        )
      )}
    </span>
  );
}
