import f from "lodash/fp";
import React from "react";
import { useSelector } from "react-redux";
import getDisplayValue from "../../helpers/getDisplayValue";
import { retrieveTranslation } from "../../helpers/multiLanguage";
import { Cell, Column, GRUDStore, Row } from "../../types/grud";

type OverlayHeadRowIdentificatorProps = {
  langtag: string;
  cell?: Pick<Cell, "table" | "row"> & Partial<Pick<Cell, "column">>;
};

type DisplayValue = Record<string, string> | Array<Record<string, string>>;

const OverlayHeadRowsIdentificator = ({
  cell,
  langtag
}: Required<OverlayHeadRowIdentificatorProps>) => {
  if (!cell) return null;

  const tableId = cell.table.id;
  const rowId = cell.row.id;

  const row = useSelector<GRUDStore, Row | undefined>(
    f.compose(
      f.find((row: Row) => row.id === rowId),
      f.prop(["rows", tableId, "data"])
    )
  );

  const firstColumn = f.prop(["cells", 0, "column"], row) as Column;
  const firstValue = f.prop(["values", 0], row);
  const displayValue = getDisplayValue(firstColumn)(firstValue);

  const columnName = retrieveTranslation(langtag)(cell.column?.displayName);

  return firstColumn ? (
    <Identificator
      displayValue={displayValue}
      columnName={columnName}
      langtag={langtag}
    />
  ) : (
    <Identificator
      displayValue={{ [langtag]: "ERROR: NO DISPLAY VALUE" }}
      columnName={columnName}
      langtag={langtag}
    />
  );
};

const Identificator = ({
  langtag,
  displayValue,
  columnName
}: {
  langtag: string;
  displayValue: DisplayValue;
  columnName: string;
}) => {
  const translate = retrieveTranslation(langtag);
  const title = Array.isArray(displayValue)
    ? displayValue.map(translate).join(" ")
    : translate(displayValue);
  return (
    <span>
      <span className="column-name">
        {!f.isEmpty(columnName) ? `${columnName}: ` : ""}
      </span>
      <span className="row-title" title={title}>
        {title}
      </span>
    </span>
  );
};

export default OverlayHeadRowsIdentificator;
