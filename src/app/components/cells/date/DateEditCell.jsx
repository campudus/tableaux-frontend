import React, { useCallback, useState } from "react";
import Datetime from "react-datetime";
import { formatDate, formatDateTime } from "../../../helpers/multiLanguage";
import Moment from "moment";

const DATE_PICKER_HEIGHT = 265;

const DateEditCell = ({ showTime, value, onChange }) => {
  const [needsShiftUp, setShift] = useState(false);

  const checkPosition = useCallback(node => {
    if (!node) return;
    const needsShiftUp =
      node.getBoundingClientRect().bottom + DATE_PICKER_HEIGHT >=
      window.innerHeight;
    setShift(needsShiftUp);
  }, []);

  const format = showTime ? formatDateTime : formatDate;

  return (
    <div ref={checkPosition}>
      {format(value)}
      {value ? (
        <i className="fa fa-ban" onMouseDown={() => onChange(null)} />
      ) : null}
      <div
        className="time-picker-wrapper"
        style={{
          position: "absolute",
          top: needsShiftUp ? -DATE_PICKER_HEIGHT : "100%"
        }}
        onMouseDown={evt => {
          evt.stopPropagation();
          evt.preventDefault();
        }}
      >
        <Datetime
          onChange={onChange}
          input={false}
          value={Moment(value)}
          initialViewMode={"days"}
          timeFormat={showTime}
          open
        />
      </div>
    </div>
  );
};

export default DateEditCell;
