import React from "react";
import f from "lodash/fp";
import Datetime from "react-datetime";
import {compose, lifecycle, withStateHandlers} from "recompose";

const enhance = compose(
  withStateHandlers(
    () => ({
      shiftUp: false
    }),
    {}
  ),
  lifecycle({
    componentWillUnmount() {
      this.props.saveChanges();
    }
  })
);

const DateEditCell = ({value, Formats, handleChange, clearDate, showTime}) => (
  <React.Fragment>
    {(f.isEmpty(value)) ? "" : value.format(Formats.formatForUser)}
    <i className="fa fa-ban"
       onClick={clearDate}
    />

    <Datetime onChange={handleChange}
              open
              input={false}
              value={value}
              timeFormat={showTime}
    />
  </React.Fragment>
);

export default enhance(DateEditCell);
