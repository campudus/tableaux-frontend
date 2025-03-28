import { t } from "i18next";
import f from "lodash/fp";
import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Action from "../../redux/actionCreators";
import { AnnotationConfigs } from "../../constants/TableauxConstants";
import { outsideClickEffect } from "../../helpers/useOutsideClick";
import { selectAnnotationHighlight } from "../../redux/reducers/tableView";
import AnnotationBadge from "../annotation/AnnotationBadge";
import {
  getAnnotationColor,
  getAnnotationTitle
} from "../../helpers/annotationHelper";
import SvgIcon from "../helperComponents/SvgIcon";
import { buildClassName } from "../../helpers/buildClassName";

const AnnotationHighlightToggle = ({ langtag }) => {
  const [showPopup, setShowPopup] = useState(false);
  const togglePopup = () => setShowPopup(!showPopup);

  const flagConfigs = f.flow(
    f.filter(config => config.kind === "flag"),
    f.sortBy("priority")
  )(AnnotationConfigs);

  const annotationHighlight = useSelector(selectAnnotationHighlight);
  const hasHighlight = !!annotationHighlight;
  const dispatch = useDispatch();

  const setAnnotationHighlight = flag => () => {
    dispatch(Action.setAnnotationHighlight(flag));
    setShowPopup(false);
  };

  const clearAnnotationHighlight = () => () => {
    dispatch(Action.setAnnotationHighlight());
    setShowPopup(false);
  };

  const containerRef = useRef();
  useEffect(
    outsideClickEffect({
      shouldListen: showPopup,
      containerRef,
      onOutsideClick: () => setShowPopup(false)
    }),
    [showPopup, containerRef.current]
  );

  return (
    <div className="annotation-highlight-toggle__wrapper">
      <div
        className={buildClassName("annotation-highlight-toggle", {
          open: showPopup,
          active: hasHighlight
        })}
      >
        <button
          className="small-button annotation-highlight-toggle__popup-button"
          onClick={togglePopup}
        >
          <SvgIcon icon="highlight" />
        </button>
      </div>
      {showPopup ? (
        <div className="annotation-highlight-toggle__popup" ref={containerRef}>
          <span className="title">{t("table:show-annotations")}</span>
          {flagConfigs.map(config => (
            <AnnotationBadge
              key={config.name}
              onClick={
                annotationHighlight === config.name
                  ? clearAnnotationHighlight()
                  : setAnnotationHighlight(config.name)
              }
              active={annotationHighlight === config.name}
              color={getAnnotationColor(config.name)}
              title={getAnnotationTitle(config.name, langtag)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
};

export default AnnotationHighlightToggle;
