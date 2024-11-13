import Moment from "moment";
import React, { useCallback, useState } from "react";
import ReactDatetime from "react-datetime";
import listensToClickOutside from "react-onclickoutside";
import {
  ColumnKinds,
  DateFormats,
  DateTimeFormats
} from "../../../constants/TableauxConstants";
import { formatDate, formatDateTime } from "../../../helpers/multiLanguage";

const Datetime = listensToClickOutside(ReactDatetime);

const DATE_PICKER_HEIGHT = 265;

const DateCell = props => {
  const { editing, actions, cell, langtag } = props;
  const { kind, multilanguage } = cell.column;
  const showTime = kind === ColumnKinds.datetime;
  const Formats = showTime ? DateTimeFormats : DateFormats;
  const format = showTime ? formatDateTime : formatDate;
  const cellValue = multilanguage ? cell.value[langtag] : cell.value;

  const [needsShiftUp, setShift] = useState(false);
  const [innerValue, setInnerValue] = useState(Moment(cellValue));

  const checkPosition = useCallback(node => {
    if (!node) return;
    const nodeBottom = node.getBoundingClientRect().bottom;
    const needsShiftUp = nodeBottom + DATE_PICKER_HEIGHT >= window.innerHeight;

    setShift(needsShiftUp);
  }, []);

  const getServerDateString = moment => {
    return moment?.isValid() ? moment.format(Formats.formatForServer) : null;
  };

  const handleChange = value => {
    setInnerValue(value);
  };

  const handleSave = value => {
    const oldValue = cell.value;
    const dateString = getServerDateString(value);
    const newValue = multilanguage ? { [langtag]: dateString } : dateString;
    actions.toggleCellEditing({ cell, editing: false });
    actions.changeCellValue({ cell, oldValue, newValue });
  };

  return (
    <>
      <div ref={checkPosition} className="cell-content">
        {innerValue?.isValid() ? format(innerValue) : null}

        {editing && innerValue ? (
          <i className="fa fa-ban" onMouseDown={() => handleSave(null)} />
        ) : null}
      </div>

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
            onChange={handleChange}
            handleClickOutside={() => handleSave(innerValue)}
            input={false}
            value={innerValue}
            initialViewMode={"days"}
            timeFormat={showTime}
            open={editing}
          />
        </div>
      )}
    </>
  );
};

export default DateCell;
