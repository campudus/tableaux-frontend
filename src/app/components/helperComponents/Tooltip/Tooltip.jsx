import React, { useEffect, useRef, useState } from "react";
import { buildClassName as bcn } from "../../../helpers/buildClassName";

const HEADER_HEIGHT = 100; // approximately

const Tooltip = ({
  style,
  className = "",
  children,
  defaultInvert = false
}) => {
  const bubbleRef = useRef();
  const [invert, setInvert] = useState(defaultInvert);

  useEffect(() => {
    const rect = bubbleRef.current && bubbleRef.current.getBoundingClientRect();
    // this ignores virtual scrolling
    if (invert || (rect && rect.y < HEADER_HEIGHT)) {
      setInvert(true);
    }
  }, [bubbleRef.current]);

  const cssClass = bcn("tooltip", { invert }, className);

  return (
    <div ref={bubbleRef} style={style} className={cssClass}>
      <div className="tooltip__content">{children}</div>
    </div>
  );
};

export default Tooltip;
