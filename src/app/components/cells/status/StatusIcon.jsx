import React, { useState } from "react";
import StatusIconTooltip from "../../helperComponents/Tooltip/Tooltip";

const FontIcon = ({ fontIconKey, style }) => (
  <i style={style} className={"fa " + `fa-${fontIconKey}`} />
);

const StatusIcon = props => {
  const { icon, color, blockMode = false, langtag, displayName, clickHandler, invertTooltip } = props;
  const { value } = icon;
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const additionalClasses = blockMode ? "status-icon__block " : "";
  const nameToDisplay = displayName[langtag || "de"];
  return (
    <div
      className={`status-icon ${additionalClasses}`}
      onMouseEnter={() => setTooltipVisible(true)}
      onMouseLeave={() => setTooltipVisible(false)}
      onClick={() => !blockMode && clickHandler(nameToDisplay)}
    >
      {!blockMode && tooltipVisible && <StatusIconTooltip translations={displayName} invert={invertTooltip}/>}
      <FontIcon style={{ color }} fontIconKey={value} />
      {blockMode && <div>{nameToDisplay}</div>}
    </div>
  );
};

export default StatusIcon;
