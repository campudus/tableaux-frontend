import { t } from "i18next";
import f from "lodash/fp";
import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Action from "../../redux/actionCreators";
import { AnnotationConfigs } from "../../constants/TableauxConstants";
import { outsideClickEffect } from "../../helpers/useOutsideClick";
import { selectAnnotationHighlight } from "../../redux/reducers/tableView";
import { AnnotationBadge } from "./filter/FilterPopup";
import { getAnnotationColor, getAnnotationTitle } from "./filter/helpers";

const AnnotationHighlightToggle = ({ langtag }) => {
  const [showPopup, setShowPopup] = useState(false);
  const togglePopup = () => setShowPopup(!showPopup);

  const flagConfigs = f.flow(
    f.filter(config => config.kind === "flag"),
    f.sortBy("priority")
  )(AnnotationConfigs);

  const annotationHighlight = useSelector(selectAnnotationHighlight);
  const dispatch = useDispatch();

  const setAnnotationHighlight = flag => () => {
    dispatch(Action.setAnnotationHighlight(flag));
    setShowPopup(false);
  };

  const clearAnnotationHighlight = () => () => {
    dispatch(Action.setAnnotationHighlight());
    setShowPopup(false);
  };

  const className = `annotation-highlight-toggle ${showPopup ? "active" : ""}`;

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
      <div className={className}>
        <button
          className="small-button annotation-highlight-toggle__popup-button"
          onClick={togglePopup}
        >
          <i className="fa fa-pencil" />
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
