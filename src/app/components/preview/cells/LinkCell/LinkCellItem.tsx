/* eslint-disable @typescript-eslint/no-explicit-any */
import { ReactElement, useCallback, useState } from "react";
import f from "lodash/fp";
import { Column } from "../../../../types/grud";
import getDisplayValue from "../../../../helpers/getDisplayValue";
import { setEmptyClassName } from "../../helper";
import { useDebouncedValue } from "../../../../helpers/useDebouncedValue";
import Tooltip from "../../../../components/helperComponents/Tooltip/Tooltip";

type LinkCellItemProps = {
  langtag: string;
  column: Column;
  value: any;
  link: string;
  path: (string | undefined)[];
  isLast: boolean;
};

export default function LinkCellItem({
  langtag,
  column,
  value,
  link,
  path,
  isLast
}: LinkCellItemProps): ReactElement {
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const debouncedTooltipVisible = useDebouncedValue(tooltipVisible, 600);
  const isVisible = tooltipVisible && debouncedTooltipVisible; // delay on open, but close instantly
  const handleMouseEnter = useCallback(() => setTooltipVisible(true), []);
  const handleMouseLeave = useCallback(() => setTooltipVisible(false), []);

  let displayValue = value;

  if (Array.isArray(value)) {
    displayValue = getDisplayValue(column)(value);

    if (Array.isArray(displayValue)) {
      displayValue = displayValue.map(v => v[langtag]).join(" ");
    } else {
      displayValue = displayValue[langtag];
    }
  } else if (column.multilanguage) {
    displayValue = value[langtag];
  }

  if (f.isBoolean(displayValue)) {
    displayValue = displayValue ? "WAHR" : "FALSCH";
  }

  return (
    <div className="link-cell-item">
      <a
        className={`link-cell-item__value preview-cell-value-link ${setEmptyClassName(
          displayValue
        )}`}
        href={link}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {!displayValue || displayValue === "" ? "Leer" : displayValue}
        {isVisible && (
          <Tooltip defaultInvert style={{ left: "10px" }}>
            {path.join(" / ")}
          </Tooltip>
        )}
      </a>

      {!isLast && <span className="link-cell-item__separator">&bull;</span>}
    </div>
  );
}
