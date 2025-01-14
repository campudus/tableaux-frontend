import React, { useCallback, useState } from "react";
import { retrieveTranslation } from "../../../helpers/multiLanguage";
import Tooltip from "../../helperComponents/Tooltip/Tooltip";

const FontIcon = ({ fontIconKey, style }) => (
  <i style={style} className={"fa " + `fa-${fontIconKey}`} />
);

const StatusIcon = props => {
  const {
    blockMode = false,
    clickHandler,
    color,
    filterValue,
    icon, // TODO: support all allowed icon types
    langtag,
    tooltip
  } = props;
  const { value } = icon;
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const additionalClasses = blockMode ? "status-icon__block " : "";
  const nameToDisplay = retrieveTranslation(langtag, tooltip);
  const handleMouseEnter = useCallback(() => setTooltipVisible(true), []);
  const handleMouseLeave = useCallback(() => setTooltipVisible(false), []);

  return (
    <div
      className={`status-icon ${additionalClasses}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={() => !blockMode && clickHandler(filterValue)}
    >
      {!blockMode && tooltipVisible ? <Tooltip>{nameToDisplay}</Tooltip> : null}
      <FontIcon style={{ color }} fontIconKey={value} />
      {blockMode && <div>{nameToDisplay}</div>}
    </div>
  );
};

export default StatusIcon;
