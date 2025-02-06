import React, { useCallback, useState } from "react";
import f from "lodash/fp";
import { useDebouncedValue } from "../../helpers/useDebouncedValue";
import Tooltip from "../helperComponents/Tooltip/Tooltip";
import { useMeasure } from "../../helpers/useMeasure";
import TextAnnotationButton from "../textannotations/TextAnnotationButton";
import AnnotationDot from "./AnnotationDot";
import {
  getAnnotationColor,
  getAnnotationConfig,
  getAnnotationTitle
} from "../../helpers/annotationHelper";

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

function AnnotationBarFlag({ color }) {
  return (
    <div
      className="annotation-bar__flag"
      style={{ backgroundColor: color }}
    ></div>
  );
}

function AnnotationBarFlagInfo({ title, color, withDot = false }) {
  return (
    <div className="annotation-bar__flag-info">
      {withDot && <AnnotationDot color={color} />}
      <div className="annotation-bar__flag-text">{title}</div>
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
  const isCommentKey = key => COMMENT_KEYS.includes(key);
  const annotationItems = f.flow(
    f.filter(([annotationKey]) => !isCommentKey(annotationKey)),
    f.flatMap(([annotationKey, annotation]) => {
      const config = getAnnotationConfig(annotationKey);
      const title = getAnnotationTitle(annotationKey, langtag, cell);
      const color = getAnnotationColor(annotationKey);
      const priority = config?.priority;
      const isTranslation = config?.name === "needs_translation";
      const hasLangtag = annotation?.langtags?.includes(langtag);

      return isPrimaryLang || (isTranslation && hasLangtag)
        ? [{ title, color, priority }]
        : [];
    }),
    f.sortBy("priority")
  )(entries);
  const hasComments = f.some(([key]) => isCommentKey(key), entries);
  const widthRequired = ELLIPSIS_WIDTH + COMMENT_BTN_WIDTH + COMMENT_BTN_GAP;
  const widthAvailable = width - widthRequired;
  const flagsCountMax = Math.floor(widthAvailable / (FLAG_WIDTH + FLAG_GAP));
  const flagsCountCurrent = annotationItems.length;
  const flagsCountAvailable = Math.min(flagsCountMax, flagsCountCurrent);
  const showEllipsis = width > 0 && flagsCountAvailable < flagsCountCurrent;

  return (
    <div ref={barRef} className="annotation-bar">
      <div className="annotation-bar__flags">
        {f
          .take(flagsCountAvailable, annotationItems)
          .map(({ title, color }) => {
            return (
              <AnnotationBarTooltipWrapper
                key={title}
                tooltip={
                  <AnnotationBarFlagInfo
                    cell={cell}
                    title={title}
                    color={color}
                    withDot
                  />
                }
              >
                <AnnotationBarFlag color={color} />
              </AnnotationBarTooltipWrapper>
            );
          })}

        {showEllipsis && (
          <AnnotationBarTooltipWrapper
            tooltip={
              <div className="annotation-bar__flag-infos">
                {annotationItems.map(({ title, color }) => (
                  <AnnotationBarFlagInfo
                    key={title}
                    cell={cell}
                    title={title}
                    color={color}
                    withDot
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
