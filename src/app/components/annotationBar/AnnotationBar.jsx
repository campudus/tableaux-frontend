import React, { useCallback, useState } from "react";
import f from "lodash/fp";
import { AnnotationConfigs } from "../../constants/TableauxConstants";
import { useDebouncedValue } from "../../helpers/useDebouncedValue";
import Tooltip from "../helperComponents/Tooltip/Tooltip";
import { useMeasure } from "../../helpers/useMeasure";
import TextAnnotationButton from "../textannotations/TextAnnotationButton";
import { retrieveTranslation } from "../../helpers/multiLanguage";

const COMMENT_KEYS = ["info", "warning", "error"];
const FLAG_WIDTH = 40;
const FLAG_GAP = 4;
const ELLIPSIS_WIDTH = 20;
const COMMENT_BTN_WIDTH = 10;
const COMMENT_BTN_GAP = 10;

function AnnotationBarTooltipWrapper({ children, tooltip }) {
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const debouncedTooltipVisible = useDebouncedValue(tooltipVisible, 300);
  const isVisible = tooltipVisible && debouncedTooltipVisible; // delay on open, but close instantly
  const handleMouseEnter = useCallback(() => setTooltipVisible(true), []);
  const handleMouseLeave = useCallback(() => setTooltipVisible(false), []);

  return (
    <div
      className="annotation-bar__tooltip-wrapper"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {isVisible && <Tooltip defaultInvert>{tooltip}</Tooltip>}
    </div>
  );
}

function AnnotationBarFlag({ config }) {
  return (
    <div
      className="annotation-bar__flag"
      style={{ backgroundColor: config?.bgColor }}
    ></div>
  );
}

function AnnotationBarFlagInfo({ config, userLangtag, withIcon = false }) {
  const text = retrieveTranslation(userLangtag, config?.displayName);

  return (
    <div className="annotation-bar__flag-info">
      {withIcon && (
        <div
          className="annotation-bar__flag-icon"
          style={{ backgroundColor: config?.bgColor }}
        />
      )}
      <div className="annotation-bar__flag-text">{text}</div>
    </div>
  );
}

function AnnotationBarEllipsis() {
  return (
    <div className="annotation-bar__ellipsis">
      <div className="annotation-bar__ellipsis-dot"></div>
      <div className="annotation-bar__ellipsis-dot"></div>
      <div className="annotation-bar__ellipsis-dot"></div>
    </div>
  );
}

export default function AnnotationBar({
  cell,
  langtag,
  userLangtag,
  annotationsOpen,
  toggleAnnotationPopup,
  isPrimaryLang
}) {
  const [barRef, { width }] = useMeasure();
  const entries = Object.entries(cell.annotations ?? {});
  const keyMap = { translationNeeded: "needs_translation" };
  const getKey = key => keyMap[key] ?? key;
  const isTranslationKey = key => key === "translationNeeded";
  const isCommentKey = key => COMMENT_KEYS.includes(key);
  const flagConfigs = f.flow(
    f.filter(([key]) => !isCommentKey(key)),
    f.flatMap(([key, flag]) => {
      const hasLang = isTranslationKey(key) && flag.langtags.includes(langtag);

      return AnnotationConfigs.filter(c => {
        return c.name === getKey(key) && (isPrimaryLang || hasLang);
      });
    }),
    f.sortBy("priority")
  )(entries);
  const hasComments = f.some(([key]) => isCommentKey(key), entries);
  const widthRequired = ELLIPSIS_WIDTH + COMMENT_BTN_WIDTH + COMMENT_BTN_GAP;
  const widthAvailable = width - widthRequired;
  const flagsCountMax = Math.floor(widthAvailable / (FLAG_WIDTH + FLAG_GAP));
  const flagsCountCurrent = flagConfigs.length;
  const flagsCountAvailable = Math.min(flagsCountMax, flagsCountCurrent);
  const showEllipsis = flagsCountAvailable < flagsCountCurrent;

  return (
    <div ref={barRef} className="annotation-bar">
      <div className="annotation-bar__flags">
        {f.take(flagsCountAvailable, flagConfigs).map(config => {
          return (
            <AnnotationBarTooltipWrapper
              key={config.name}
              tooltip={
                <AnnotationBarFlagInfo
                  config={config}
                  userLangtag={userLangtag}
                  withIcon
                />
              }
            >
              <AnnotationBarFlag config={config} userLangtag={userLangtag} />
            </AnnotationBarTooltipWrapper>
          );
        })}

        {showEllipsis && (
          <AnnotationBarTooltipWrapper
            tooltip={
              <div className="annotation-bar__flag-infos">
                {flagConfigs.map(config => (
                  <AnnotationBarFlagInfo
                    key={config.name}
                    config={config}
                    userLangtag={userLangtag}
                    withIcon
                  />
                ))}
              </div>
            }
          >
            <AnnotationBarEllipsis />
          </AnnotationBarTooltipWrapper>
        )}
      </div>

      {(hasComments || annotationsOpen) && isPrimaryLang && (
        <div className="annotation-bar__comment-button">
          <TextAnnotationButton
            open={annotationsOpen}
            cell={cell}
            togglePopup={toggleAnnotationPopup}
            langtag={userLangtag}
          />
        </div>
      )}
    </div>
  );
}
