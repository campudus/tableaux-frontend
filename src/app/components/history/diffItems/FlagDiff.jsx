import React from "react";
import AnnotationBadge from "../../annotation/AnnotationBadge";
import {
  getAnnotationColor,
  getAnnotationTitle
} from "../../../helpers/annotationHelper";

const FlagDiff = props => {
  const {
    langtag,
    revision,
    revision: { event }
  } = props;

  const value = revision.value || revision.valueType;

  return (
    <AnnotationBadge
      key={value}
      className={event}
      active={true}
      color={getAnnotationColor(value)}
      title={getAnnotationTitle(value, langtag)}
    />
  );
};

export default FlagDiff;
