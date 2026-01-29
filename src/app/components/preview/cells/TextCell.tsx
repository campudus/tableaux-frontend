import { ReactElement, useCallback, useState } from "react";
import { getEmptyClassName } from "../helper";
import i18n from "i18next";
import { useDebouncedValue } from "../../../helpers/useDebouncedValue";
import { getColumnDisplayName } from "../../../helpers/multiLanguage";
import Tooltip from "../../helperComponents/Tooltip/Tooltip";
import { Column } from "../../../types/grud";

type TextCellProps = {
  langtag: string;
  column: Column;
  multilangValue: Record<string, string>;
  isTitle?: boolean;
};

const TEXT_MAX_LENGTH = 250;

export default function TextCell({
  langtag,
  column,
  multilangValue,
  isTitle = false
}: TextCellProps): ReactElement {
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const debouncedTooltipVisible = useDebouncedValue(tooltipVisible, 600);
  const isVisible = tooltipVisible && debouncedTooltipVisible; // delay on open, but close instantly
  const handleMouseEnter = useCallback(() => setTooltipVisible(true), []);
  const handleMouseLeave = useCallback(() => setTooltipVisible(false), []);

  const value = multilangValue[langtag];
  const columnDisplayName = getColumnDisplayName(column, langtag);

  if (value && value.length > TEXT_MAX_LENGTH) {
    return (
      <span className="text-cell">{value.slice(0, TEXT_MAX_LENGTH)}...</span>
    );
  }

  return (
    <span
      className={`text-cell ${getEmptyClassName(value)}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {value || i18n.t("preview:empty")}

      {isTitle && isVisible && columnDisplayName && (
        <Tooltip defaultInvert style={{ left: "10px", fontSize: "13px" }}>
          {columnDisplayName}
        </Tooltip>
      )}
    </span>
  );
}
