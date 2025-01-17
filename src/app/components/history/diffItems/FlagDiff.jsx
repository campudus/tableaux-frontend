import React from "react";
import { AnnotationBadge } from "../../header/filter/FilterPopup";
import {
  getAnnotationColor,
  getAnnotationTitle
} from "../../header/filter/helpers";

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
