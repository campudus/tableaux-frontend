import { pure } from "recompose";
import React, { useRef, useState } from "react";

import PropTypes from "prop-types";
import f from "lodash/fp";

const getColorForPercentage = (perc, gradient) => {
  if (!gradient) return null;
  const percCoord = (perc / 100.0) * gradient.height;
  const x = 0;
  const y = Math.min(percCoord, gradient.height - 1);
  const [r, g, b] = gradient.getContext("2d").getImageData(x, y, 1, 1).data;
  return `rgb(${r},${g},${b})`;
};

const toCartesian = (radians, radius) => ({
  x: radius + radius * Math.cos(radians),
  y: radius + radius * Math.sin(radians)
});

const mkArcSvg = (p, radius) => {
  const angle = 3.6 * p;
  const rAngle = ((angle - 90) * Math.PI) / 180.0;

  const start = toCartesian(rAngle, radius);
  const end = toCartesian(-Math.PI / 2, radius);

  const arcSweep = angle > 180 ? 1 : 0;

  return [
    "M",
    start.x,
    start.y,
    "A",
    radius,
    radius,
    0,
    arcSweep,
    0,
    end.x,
    end.y
  ].join(" ");
};

const CircleGraph = ({ percent, radius = 50 }) => {
  const gradientImg = useRef();
  const gradientCnv = useRef();
  const [perc, setPercAndRender] = useState(0);

  const initGradient = () => {
    const cnv = gradientCnv.current;
    const img = gradientImg.current;
    cnv.height = img.height;
    !f.isNil(cnv) &&
      cnv.getContext("2d").drawImage(img, 0, 0, img.width, img.height);
    setPercAndRender(percent);
  };

  const percentage = f.clamp(0, 100, percent);

  return (
    <React.Fragment>
      <div className="gradient" style={{ display: "none" }}>
        <img
          ref={gradientImg}
          src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAABkCAYAAABHLFpgAAAACXBIWXMAAAsSAAALEgHS3X78AAAAhElEQVQYlY2PwQ7CMAxDHXdo/Bl/wf9fOO9EMyUh7RqBxMXyqx1rw+vxVEIAAop0AEUGusOKMitTMo2A5aIE6wqXKZnIX7f87y2maqXnW7m4YFYuaTO5pWg4+0F320Bz6rglfmRgA6i+Zy6W3cVnAHyjgUe/g4fuJu4GRrCmvfS+lHXHCaPMaZUc/VrSAAAAAElFTkSuQmCC"
          onLoad={initGradient}
        />
        <canvas ref={gradientCnv} />
      </div>
      <div className="circle-chart">
        <svg
          style={{
            width: 2 * radius,
            height: 2 * radius
          }}
        >
          <circle
            cx={radius}
            cy={radius}
            r={radius}
            fill="transparent"
            strokeWidth={1}
          />
          <path
            stroke={getColorForPercentage(perc, gradientCnv.current)}
            strokeWidth={1}
            d={mkArcSvg(Math.min(perc, 99.99), radius)}
            fill="transparent"
          />
        </svg>
        <div
          style={{
            color: getColorForPercentage(percentage, gradientCnv.current)
          }}
          className="label"
        >
          <span>{((percentage * 10) | 0) / 10}</span>
          <span className="percent-sign">%</span>
        </div>
      </div>
    </React.Fragment>
  );
};

CircleGraph.propTypes = {
  percent: PropTypes.number.isRequired
};

export default pure(CircleGraph);
