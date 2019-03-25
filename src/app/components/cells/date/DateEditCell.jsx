import Datetime from "react-datetime";
import Moment from "moment";
import React, { useState, useEffect, useCallback, useRef } from "react";

import { maybe, stopPropagation } from "../../../helpers/functools";

const DATE_PICKER_HEIGHT = 265;

const DateEditCell = props => {
  const { actions, cell, langtag, Formats, showTime } = props;
  const isMultiLanguage = cell.column.multilanguage;

  const getValue = obj => (isMultiLanguage ? obj[langtag] : obj);

  const [needsShiftUp, setShift] = useState(false);
  // state value that doesn't trigger a re-render, so time picker won't close every click
  const momentRef = useRef(
    maybe(getValue(cell.value))
      .map(str => Moment(str))
      .getOrElse(null)
  );
  const setMoment = m => {
    momentRef.current = m;
  };

  const checkPosition = useCallback(node => {
    if (!node) return;
    const needsShiftUp =
      node.getBoundingClientRect().bottom + DATE_PICKER_HEIGHT >=
      window.innerHeight;
    setShift(needsShiftUp);
  });

  const saveValue = () => {
    const momentString = momentRef.current
      ? momentRef.current.format(Formats.formatForServer)
      : null;
    actions.changeCellValue({
      cell,
      oldValue: cell.value,
      newValue: isMultiLanguage ? { [langtag]: momentString } : momentString
    });
  };

  const setAndSave = moment => {
    setMoment(moment);
    saveValue();
  };

  useEffect(() => {
    // cleanup gets called on unmount, so we won't save & re-render constantly
    return () => {
      if (
        momentRef.current && // check this or next line might crash
        !momentRef.current.isSame(Moment(getValue(cell.value)))
      ) {
        saveValue();
      }
    };
  }, [momentRef]);

  return (
    <div ref={checkPosition}>
      {maybe(getValue(cell.value))
        .map(str => Moment(str))
        .map(m => m.format(Formats.formatForUser))
        .getOrElse("")}
      <i className="fa fa-ban" onClick={() => setAndSave(null)} />
      <div
        className="time-picker-wrapper"
        style={{
          position: "absolute",
          top: needsShiftUp ? -DATE_PICKER_HEIGHT : "100%"
        }}
        onClick={stopPropagation}
      >
        <Datetime
          onChange={setMoment}
          input={false}
          defaultValue={momentRef.current || Moment()}
          timeFormat={showTime}
          open
        />
      </div>
    </div>
  );
};

export default DateEditCell;
