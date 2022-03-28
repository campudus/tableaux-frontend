import i18n from "i18next";
import React, { useEffect, useRef, useState } from "react";
import { retrieveTranslation } from "../../../helpers/multiLanguage";
import { buildClassName as bcn } from "../../../helpers/buildClassName";

const HEADER_HEIGHT = 100; // approximately

const StatusIconTooltip = ({ translations, langtag }) => {
  const bubbleRef = useRef();
  const text = retrieveTranslation(langtag, translations);

  const [invert, setInvert] = useState(false);

  useEffect(() => {
    const rect = bubbleRef.current && bubbleRef.current.getBoundingClientRect();
    // this ignores virtual scrolling
    if (invert || (rect && rect.y < HEADER_HEIGHT)) {
      setInvert(true);
    }
  }, [bubbleRef.current]);

  const cssClass = bcn("tooltip", { invert });

  return (
    <div ref={bubbleRef} className={cssClass}>
      <div className="tooltip__content">
        {text && <div className="tooltip__text">{i18n.t(text)}</div>}
      </div>
    </div>
  );
};

export default StatusIconTooltip;
