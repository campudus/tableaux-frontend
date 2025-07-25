/* eslint-disable @typescript-eslint/no-explicit-any */
import { ReactElement } from "react";
import f from "lodash/fp";
import { Column } from "../../../../types/grud";
import getDisplayValue from "../../../../helpers/getDisplayValue";
import { setEmptyClassName } from "../../helper";

type LinkCellItemProps = {
  langtag: string;
  column: Column;
  value: any;
  link: string;
  isLast: boolean;
};

export default function LinkCellItem({
  langtag,
  column,
  value,
  link,
  isLast
}: LinkCellItemProps): ReactElement {
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
    displayValue = displayValue.toString();
  }

  return (
    <div className="link-cell-item">
      <a
        className={`link-cell__item ${setEmptyClassName(displayValue)}`}
        href={link}
      >
        {!displayValue || displayValue === "" ? "Leer" : displayValue}
      </a>

      {!isLast && <span className="array-cell__separator">&bull;</span>}
    </div>
  );
}
