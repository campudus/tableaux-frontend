import Moment from "moment";
import React from "react";
import f from "lodash/fp";

import {
  ColumnKinds,
  DateFormats,
  DateTimeFormats
} from "../../../constants/TableauxConstants";
import { formatDate, formatDateTime } from "../../../helpers/multiLanguage";
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
  const format = showTime ? formatDateTime : formatDate;

  return editing ? (
    <DateEditCell
      Formats={Formats}
      langtag={langtag}
      actions={actions}
      cell={cell}
      showTime={showTime}
    />
  ) : (
    <div className="cell-content">{format(validatedValue)}</div>
  );
};

export default DateCellWrapper;
