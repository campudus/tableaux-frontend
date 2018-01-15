import React from "react";
import PropTypes from "prop-types";
import f from "lodash/fp";
import {pure} from "recompose";

const getColorForPercentage = f.cond([
  [f.lt(90), f.always("#56d1a6")],
  [f.lt(80), f.always("#f8e71c")],
  [f.lt(50), f.always("#f5a623")],
  [f.stubTrue, f.always("#f35a5a")]
]);

const toCartesian = (radians, radius) => (
  {
    x: radius + radius * Math.cos(radians),
    y: radius + radius * Math.sin(radians)
  }
);

const mkArcSvg = (p, radius) => {
  const angle = 3.6 * p;
  const rAngle = (angle - 90) * Math.PI / 180.0;

  const start = toCartesian(rAngle, radius);
  const end = toCartesian(-Math.PI / 2, radius);

  const arcSweep = (angle > 180) ? 1 : 0;

  return [
    "M", start.x, start.y,
    "A", radius, radius, 0, arcSweep, 0, end.x, end.y
  ].join(" ");
};

const CircleGraph = ({percent, radius = 50}) => {
  const percentage = f.clamp(0, 100, percent);
  return (
    <div className="circle-chart">
      <svg style={
        {
          width: 2 * radius,
          height: 2 * radius
        }
      }
      >
        <circle cx={radius}
                cy={radius}
                r={radius}
                fill="transparent"
                strokeWidth={1}
        />
        <path stroke={getColorForPercentage(percentage)}
              strokeWidth={1}
              d={mkArcSvg(percentage, radius)}
              fill="transparent"
        />
      </svg>
      <div style={{color: getColorForPercentage(percentage)}}
           className="label">
        {((percentage * 10) | 0) / 10 + "%"}
      </div>
    </div>
  );
}

CircleGraph.propTypes = {
  percent: PropTypes.number.isRequired
};

export default pure(CircleGraph);
