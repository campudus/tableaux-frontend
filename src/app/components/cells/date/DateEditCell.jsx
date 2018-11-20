import React from "react";
import ReactDOM from "react-dom";
import f from "lodash/fp";
import Datetime from "react-datetime";
import {compose, lifecycle, withHandlers, withStateHandlers} from "recompose";

const enhance = compose(
  withStateHandlers(
    () => ({
      shiftUp: false,
      domNode: null
    }),
    {
      checkPosition: ({domNode, shiftUp}) => (node = domNode) => {
        if (f.isNil(node)) {
          return;
        }

        const rect = ReactDOM.findDOMNode(node).getBoundingClientRect();
        const needsShiftUp = rect.bottom + 265 >= window.innerHeight;
        if (needsShiftUp !== shiftUp) {
          return {
            shiftUp: needsShiftUp,
            domNode: node
          };
        } else if (f.isNil(domNode)) {
          return {domNode: node};
        }
      }
    }
  ),
  withHandlers({
    getStyle: ({shiftUp}) => () => ({
      position: "absolute",
      top: (shiftUp) ? -265 : "100%"
    })
  }),
  lifecycle({
    componentWillUnmount() {
      this.props.saveChanges();
    }
  })
);

const DateEditCell = ({value, Formats, handleChange, clearDate, showTime, checkPosition, getStyle}) => (
  <div ref={checkPosition}>
    {(f.isEmpty(value)) ? "" : value.format(Formats.formatForUser)}
    <i className="fa fa-ban"
       onClick={clearDate}
    />

    <div className="time-picker-wrapper"
         style={getStyle()}
    >
      <Datetime onChange={handleChange}
                open
                input={false}
                value={value}
                timeFormat={showTime}
      />
    </div>
  </div>
);

export default enhance(DateEditCell);
