import React, { useState } from "react";
import PropTypes from "prop-types";
import { deleteCellAnnotation } from "../../helpers/annotationHelper";
import { DateTimeFormats } from "../../constants/TableauxConstants";
import Moment from "moment";
import f from "lodash/fp";

const FADE_OUT_TIME = 200; // milliseconds

const AnnotationEntry = props => {
  const [confirmed, setConfirmed] = useState(false);
  const { cell, annotation, idx } = props;

  const confirm = () => {
    setConfirmed(true);
    setTimeout(
      () => deleteCellAnnotation(annotation, cell, true),
      FADE_OUT_TIME
    );
  };

  const style = confirmed
    ? {
        transition: `transform ${FADE_OUT_TIME}ms`,
        transform: "scale(0)"
      }
    : {
        transition: `transform ${FADE_OUT_TIME}ms`,
        transform: "scale(1)"
      };

  const messageIcon = f.cond([
    [f.eq("info"), f.always("fa-commenting")],
    [f.eq("warning"), f.always("fa-exclamation-circle")],
    [f.eq("error"), f.always("fa-exclamation-triangle")]
  ])(annotation.type);

  const timeString = new Moment(annotation.createdAt)
    .utcOffset(new Date().getTimezoneOffset())
    .format(DateTimeFormats.formatForUser);

  return (
    <div className={`annotation-item ${annotation.type}`} style={style}>
      <i className={`fa ${messageIcon} message-icon`} />
      <div className="message">
        <div className="text-label">{annotation.value || "nachricht"}</div>
        <div className="date-label">{timeString}</div>
      </div>
      <div className="info-column">
        <a href="#" className="delete-button" onClick={confirm}>
          <i className="fa fa-trash delete-icon" />
        </a>
        <div className="number-label">{`#${idx}`}</div>
      </div>
    </div>
  );
};

export default AnnotationEntry;
AnnotationEntry.propTypes = {
  annotation: PropTypes.object.isRequired,
  cell: PropTypes.object.isRequired,
  idx: PropTypes.number.isRequired
};
