import f from "lodash/fp";
import React from "react";
import { FilterModes } from "../../../constants/TableauxConstants";
import { retrieveTranslation } from "../../../helpers/multiLanguage";
import StatusIcon from "./StatusIcon";

const StatusCell = props => {
  const {
    cell: { column, value },
    langtag,
    actions: { appendFilters }
  } = props;

  const setStatusFilter = columnId => value => {
    const filterToSet = {
      colId: columnId,
      compareValue: value,
      value: true,
      columnId: value,
      mode: FilterModes.STATUS,
      columnKind: "status"
    };
    appendFilters(filterToSet);
  };

  const findElementForLanguage = (...elems) =>
    elems.find(
      elem => !f.isEmpty(elem) && !!retrieveTranslation(langtag, elem)
    ) || {};

  const renderSymbols = f.compose(
    f.map(val => (
      <StatusIcon
        key={"StatusIcon " + val.name}
        icon={val.icon}
        color={val.color}
        tooltip={findElementForLanguage(val.tooltip, val.displayName)}
        filterValue={val.name}
        langtag={langtag}
        clickHandler={setStatusFilter(column.id)}
      />
    )),
    f.filter({ value: true }),
    f.zipWith((a, b) => ({ value: a, ...b }), value)
  );

  return <div className="status-cell">{renderSymbols(column.rules)}</div>;
};

export default StatusCell;
