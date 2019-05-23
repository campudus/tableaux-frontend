import Datetime from "react-datetime";
import Moment from "moment";
import React, { useState, useEffect, useCallback, useRef } from "react";

import { formatDate, formatDateTime } from "../../../helpers/multiLanguage";
import { maybe, stopPropagation } from "../../../helpers/functools";

const DATE_PICKER_HEIGHT = 265;

const DateEditCell = props => {
  const { actions, cell, langtag, Formats, showTime } = props;
  const isMultiLanguage = cell.column.multilanguage;

  const getValue = obj => (isMultiLanguage ? obj[langtag] : obj);

  const [needsShiftUp, setShift] = useState(false);
  const [viewMode, setViewMode] = useState("days");
  const [selectedMoment, setMomentState] = useState(
    maybe(getValue(cell.value))
      .map(str => Moment(str))
      .getOrElse(new Moment())
  );

  const mutableMoment = useRef(selectedMoment);
  const setMoment = moment => {
    setMomentState(moment);
    mutableMoment.current = moment;
  };

  const checkPosition = useCallback(node => {
    if (!node) return;
    const needsShiftUp =
      node.getBoundingClientRect().bottom + DATE_PICKER_HEIGHT >=
      window.innerHeight;
    setShift(needsShiftUp);
  });

  const saveValue = () => {
    const momentString = mutableMoment.current
      ? mutableMoment.current.format(Formats.formatForServer)
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
        maybe(mutableMoment.current)
          .map(m => !m.isSame(Moment(getValue(cell.value))))
          .getOrElse(false)
      ) {
        saveValue();
      }
    };
  }, []);

  const format = showTime ? formatDateTime : formatDate;

  return (
    <div ref={checkPosition}>
      {format(selectedMoment)}
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
          onViewModeChange={setViewMode}
          onChange={setMoment}
          input={false}
          defaultValue={selectedMoment}
          viewMode={viewMode}
          timeFormat={showTime}
          open
        />
      </div>
    </div>
  );
};

export default DateEditCell;
