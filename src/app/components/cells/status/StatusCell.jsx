import React from "react";
import StatusIcon from "./StatusIcon";
import { FilterModes } from "../../../constants/TableauxConstants";
import f from "lodash/fp";

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

  const renderSymbols = () => {
    const valuesToRender = f.compose(
      f.map(val => (
        <StatusIcon
          key={"StatusIcon " + val.name}
          icon={val.icon}
          color={val.color}
          displayName={val.displayName}
          langtag={langtag}
          clickHandler={filterStatus(column.id)}
          invertTooltip={rowIndex === 0}
        />
      )),
      f.filter({ value: true }),
      f.zipWith((a, b) => ({ value: a, ...b }), value)
    )(column.rules);
    return valuesToRender;
  };
  return <div className="status-cell">{renderSymbols()}</div>;
};

export default StatusCell;