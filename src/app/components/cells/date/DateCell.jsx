import Moment from "moment";
import React from "react";
import {
  ColumnKinds,
  DateFormats,
  DateTimeFormats
} from "../../../constants/TableauxConstants";
import { formatDate, formatDateTime } from "../../../helpers/multiLanguage";
import DateEditCell from "./DateEditCell";
import f from "lodash/fp";

const DateCell = props => {
  const { editing, actions, cell, langtag } = props;
  const showTime = cell.column.kind === ColumnKinds.datetime;
  const Formats = showTime ? DateTimeFormats : DateFormats;

  const format = f.compose(
    showTime ? formatDateTime : formatDate,
    Moment
  );

  const getValue = cell =>
    cell.column.multilanguage ? cell.value[langtag] : cell.value;
  const toValue = value => {
    const saveable = value && Moment(value).format(Formats.formatForServer);
    return cell.column.multilanguage ? { [langtag]: saveable } : saveable;
  };

  const saveValue = moment => {
    actions.toggleCellEditing({ cell, editing: false });
    actions.changeCellValue({
      cell,
      oldValue: cell.value,
      newValue: toValue(moment)
    });
  };

  const cellValue = getValue(cell);

  return editing ? (
    <DateEditCell
      Formats={Formats}
      langtag={langtag}
      onChange={saveValue}
      showTime={showTime}
      value={cellValue}
    />
  ) : (
    <div className="cell-content">{cellValue ? format(cellValue) : ""}</div>
  );
};

export default DateCell;
