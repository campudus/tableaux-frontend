import f from "lodash/fp";
import React from "react";
import { FilterModes } from "../../../constants/TableauxConstants";
import StatusIcon from "./StatusIcon";
import { retrieveTranslation } from "../../../helpers/multiLanguage";

const StatusCell = props => {
  const {
    cell: { column, value },
    langtag,
    actions: { appendFilters },
    rowIndex
  } = props;

  const filterStatus = columnId => value => {
    appendFilters({
      colId: columnId,
      compareValue: value,
      value: true,
      columnId: value,
      mode: FilterModes.STATUS,
      columnKind: "status"
    });
  };

  const findElementForLanguage = (...elems) =>
    elems.find(retrieveTranslation(langtag)) || {};

  const renderSymbols = f.compose(
    f.map(val => (
      <StatusIcon
        key={"StatusIcon " + val.name}
        icon={val.icon}
        color={val.color}
        tooltip={findElementForLanguage(val.tooltip, val.displayName)}
        langtag={langtag}
        clickHandler={filterStatus(column.id)}
        invertTooltip={rowIndex === 0}
      />
    )),
    f.filter({ value: true }),
    f.zipWith((a, b) => ({ value: a, ...b }), value)
  );

  return <div className="status-cell">{renderSymbols(column.rules)}</div>;
};

export default StatusCell;
