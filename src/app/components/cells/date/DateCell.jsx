import Moment from "moment";
import React from "react";
import f from "lodash/fp";

import {
  ColumnKinds,
  DateFormats,
  DateTimeFormats
} from "../../../constants/TableauxConstants";
import { maybe, when } from "../../../helpers/functools";
import DateEditCell from "./DateEditCell";

const DateCellWrapper = props => {
  const { editing, actions, cell, langtag } = props;
  const showTime = cell.column.kind === ColumnKinds.datetime;
  const Formats = showTime ? DateTimeFormats : DateFormats;
  const validatedValue = maybe(cell.value)
    .map(when(() => cell.column.multilanguage, f.prop(langtag)))
    .map(str => Moment(str))
    .getOrElse(null);

  return editing ? (
    <DateEditCell
      Formats={Formats}
      langtag={langtag}
      actions={actions}
      cell={cell}
      showTime={showTime}
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
