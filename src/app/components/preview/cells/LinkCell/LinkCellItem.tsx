/* eslint-disable @typescript-eslint/no-explicit-any */
import { ReactElement, useCallback, useState } from "react";
import f, { isBoolean } from "lodash/fp";
import { Column } from "../../../../types/grud";
import getDisplayValue from "../../../../helpers/getDisplayValue";
import { getEmptyClassName } from "../../helper";
import { useDebouncedValue } from "../../../../helpers/useDebouncedValue";
import Tooltip from "../../../../components/helperComponents/Tooltip/Tooltip";
import i18n from "i18next";
import BooleanCell from "../BooleanCell";

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

  const displayValue = f.cond([
    [
      () => isBoolean(value),
      () =>
        column.displayName?.[langtag] ||
        i18n.t(value ? "preview:yes" : "preview:no")
    ],
    [(v: any) => Array.isArray(v), (v: any) => f.map(langtag, v).join(" ")],
    [() => true, (v: any) => v[langtag]]
  ])(getDisplayValue(column)(value));

  return (
    <div className="link-cell-item">
      <a
        className={`link-cell-item__value  ${getEmptyClassName(displayValue)}`}
        href={link}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {isBoolean(value) ? (
          <BooleanCell value={value} displayValue={displayValue} />
        ) : (
          displayValue || i18n.t("preview:empty")
        )}

        {isVisible && (
          <Tooltip defaultInvert style={{ left: "10px", fontSize: "13px" }}>
            {path.join(" / ")}
          </Tooltip>
        )}
      </a>

      {!isLast && <span className="item-separator">&bull;</span>}
    </div>
  );
}
