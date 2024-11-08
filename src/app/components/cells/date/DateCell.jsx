import Moment from "moment";
import React, { useCallback, useState } from "react";
import Datetime from "react-datetime";
import {
  ColumnKinds,
  DateFormats,
  DateTimeFormats
} from "../../../constants/TableauxConstants";
import { formatDate, formatDateTime } from "../../../helpers/multiLanguage";

const DATE_PICKER_HEIGHT = 265;

const DateCell = props => {
  const { editing, actions, cell, langtag } = props;
  const showTime = cell.column.kind === ColumnKinds.datetime;
  const Formats = showTime ? DateTimeFormats : DateFormats;
  const format = showTime ? formatDateTime : formatDate;

  const [needsShiftUp, setShift] = useState(false);

  const checkPosition = useCallback(node => {
    if (!node) return;
    const nodeBottom = node.getBoundingClientRect().bottom;
    const needsShiftUp = nodeBottom + DATE_PICKER_HEIGHT >= window.innerHeight;

    setShift(needsShiftUp);
  }, []);

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

  return (
    <div className="cell-content" ref={checkPosition}>
      {cellValue ? format(cellValue) : ""}

      {editing && cellValue ? (
        <i className="fa fa-ban" onMouseDown={() => saveValue(null)} />
      ) : null}

      {editing && (
        <div
          className="time-picker-wrapper"
          style={{
            position: "absolute",
            top: needsShiftUp ? -DATE_PICKER_HEIGHT : "100%"
          }}
          onClick={evt => {
            evt.stopPropagation();
            evt.preventDefault();
          }}
        >
          <Datetime
            onChange={saveValue}
            input={false}
            value={Moment(cellValue)}
            initialViewMode={"days"}
            timeFormat={showTime}
            open
          />
        </div>
      )}
    </div>
  );
};

export default DateCell;
