import React from "react";
import StatusIcon from "../../cells/status/StatusIcon";
import f from "lodash/fp";

const StatusView = props => {
  const {
    cell: { value, column },
    langtag
  } = props;

  const valuesToRender = f.compose(
    f.map(val => (
      <StatusIcon
        key={"StatusIcon " + val.name}
        icon={val.icon}
        tooltip={val.tooltip}
        color={val.color}
        displayName={val.displayName}
        langtag={langtag}
        blockMode
      />
    )),
    f.filter({ value: true }),
    f.zipWith(
      (singleValue, column) => ({ value: singleValue, ...column }),
      value
    )
  )(column.rules);

  return (
    <div className="item-content">
      <div className="content-wrapper status">{valuesToRender}</div>
    </div>
  );
};

export default StatusView;
