import React from "react";
import { ReactElement } from "react";
import f from "lodash/fp";
import { setEmptyClassName } from "../helper";

type ArrayCellProps = {
  langtag: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  values: any[];
};

export default function ArrayCell({
  langtag,
  values
}: ArrayCellProps): ReactElement {
  if (f.isEmpty(values)) {
    return <span className="array-cell empty">Leer</span>;
  }

  return (
    <div className="array-cell">
      {values.map((value, index) => (
        <React.Fragment key={index}>
          <span className={setEmptyClassName(value[langtag])}>
            {value[langtag] || "Leer"}
          </span>

          {index < values.length - 1 && (
            <span className="array-cell__separator">&bull;</span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
