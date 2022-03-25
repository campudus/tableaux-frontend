import React, { useState } from "react";
import StatusIconTooltip from "../../helperComponents/Tooltip/Tooltip";

const FontIcon = ({ fontIconKey, style }) => (
  <i style={style} className={"fa " + `fa-${fontIconKey}`} />
);

const StatusIcon = props => {
  const {
    icon, // TODO: support all allowed icon types
    color,
    blockMode = false,
    langtag,
    tooltip,
    clickHandler,
    invertTooltip
  } = props;
  const { value } = icon;
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const additionalClasses = blockMode ? "status-icon__block " : "";
  const nameToDisplay = tooltip[langtag || "de"];
  return (
    <div
      className={`status-icon ${additionalClasses}`}
      onMouseEnter={() => setTooltipVisible(true)}
      onMouseLeave={() => setTooltipVisible(false)}
      onClick={() => !blockMode && clickHandler(nameToDisplay)}
    >
      {!blockMode && tooltipVisible && (
        <StatusIconTooltip translations={tooltip} invert={invertTooltip} />
      )}
      <FontIcon style={{ color }} fontIconKey={value} />
      {blockMode && <div>{nameToDisplay}</div>}
    </div>
  );
};

export default StatusIcon;
