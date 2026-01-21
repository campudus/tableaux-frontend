import { ReactElement } from "react";
import SvgIcon from "../../helperComponents/SvgIcon";
import i18n from "i18next";

type BooleanCellProps = {
  value: boolean;
  displayValue?: string;
};

export default function BooleanCell({
  value,
  displayValue
}: BooleanCellProps): ReactElement {
  return (
    <div className="boolean-cell">
      <SvgIcon
        icon={value ? "check" : "cross"}
        containerClasses={value ? "color-success" : "color-red"}
      />
      <span>
        {displayValue || (value ? i18n.t("preview:yes") : i18n.t("preview:no"))}
      </span>
    </div>
  );
}
