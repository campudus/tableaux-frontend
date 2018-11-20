import React from "react";
import {
  branch,
  compose,
  pure,
  renderComponent,
  withProps,
  withStateHandlers
} from "recompose";
import Moment from "moment";
import f from "lodash/fp";
import {
  ColumnKinds,
  DateFormats,
  DateTimeFormats
} from "../../../constants/TableauxConstants";
import DateEditCell from "./DateEditCell";

const DateCellWrapper = props => {
  const {editing, value} = props;
  const showTime = f.get("kind", props.cell) === ColumnKinds.datetime;
  const Formats = showTime ? DateTimeFormats : DateFormats;
  const validatedValue = f.isEmpty(props.value) ? null : Moment(props.value);

  return editing ? (
    <DateEditCell
      value={validatedValue}
      Formats={Formats}
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
