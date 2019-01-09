import React from "react";
import Moment from "moment";
import f from "lodash/fp";
import {
  ColumnKinds,
  DateFormats,
  DateTimeFormats
} from "../../../constants/TableauxConstants";
import DateEditCell from "./DateEditCell";

const DateCellWrapper = props => {
  const { editing, actions, value, table, row, column, langtag } = props;
  const showTime = column.kind === ColumnKinds.datetime;
  const Formats = showTime ? DateTimeFormats : DateFormats;
  const validatedValue = f.isEmpty(value) ? null : Moment(value);

  return editing ? (
    <DateEditCell
      value={validatedValue}
      Formats={Formats}
      langtag={langtag}
      actions={actions}
      table={table}
      row={row}
      column={column}
    />
  ) : (
    <div className="cell-content">
      {f.isEmpty(validatedValue)
        ? ""
        : validatedValue.format(Formats.formatForUser)}
    </div>
  );
};

export default DateCellWrapper;
