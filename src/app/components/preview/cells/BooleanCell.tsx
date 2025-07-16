import { ReactElement } from "react";
import SvgIcon from "../../helperComponents/SvgIcon";

type BooleanCellProps = {
  langtag: string;
  value: boolean;
};

export default function BooleanCell({
  langtag,
  value
}: BooleanCellProps): ReactElement {
  return (
    <div className="boolean-cell">
      <SvgIcon
        icon={value ? "check" : "cross"}
        containerClasses={value ? "color-success" : "color-red"}
      />
      <span>{value ? "Ja" : "Nein"}</span>
    </div>
  );
}
