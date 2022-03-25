import React, { useCallback, useState } from "react";
import { retrieveTranslation } from "../../../helpers/multiLanguage";
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
    clickHandler
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
      onClick={() => !blockMode && clickHandler(nameToDisplay)}
    >
      {!blockMode && tooltipVisible ? (
        <StatusIconTooltip langtag={langtag} translations={tooltip} />
      ) : null}
      <FontIcon style={{ color }} fontIconKey={value} />
      {blockMode && <div>{nameToDisplay}</div>}
    </div>
  );
};

export default StatusIcon;
