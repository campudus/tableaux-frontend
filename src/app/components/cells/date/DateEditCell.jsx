import React, {Component} from "react";
import ReactDOM from "react-dom";
import f from "lodash/fp";
import Datetime from "react-datetime";

class DateEditCell extends Component {
  state = {
    shiftUp: false,
    domNode: null
  };
  checkPosition = (node = this.state.domNode) => {
    if (f.isNil(node)) {
      return;
    }

    const rect = ReactDOM.findDOMNode(node).getBoundingClientRect();
    const needsShiftUp = rect.bottom + 265 >= window.innerHeight;
    if (needsShiftUp !== this.state.shiftUp) {
      this.setState({
        shiftUp: needsShiftUp,
        domNode: node
      });
    } else if (f.isNil(this.state.domNode)) {
      this.setState({domNode: node});
    }
  };

  getStyle = () => ({
    position: "absolute",
    top: this.state.shiftUp ? -265 : "100%"
  });

  render() {
    const {value, Formats, showTime} = this.props;
    return (
      <div ref={this.checkPosition}>
        {f.isEmpty(value) ? "" : value.format(Formats.formatForUser)}
        <i className="fa fa-ban" onClick={() => console.log("clearDate")} />

        <div className="time-picker-wrapper" style={this.getStyle()}>
          <Datetime
            onChange={() => console.log("onChangeDatetime")}
            open
            input={false}
            value={value}
            timeFormat={showTime}
          />
        </div>
      </div>
    );
  }
}
export default DateEditCell;

