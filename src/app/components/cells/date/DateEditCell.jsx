import Datetime from "react-datetime";
import React, { Component } from "react";
import ReactDOM from "react-dom";

import f from "lodash/fp";

import { stopPropagation } from "../../../helpers/functools";

class DateEditCell extends Component {
  state = {
    shiftUp: false,
    domNode: null
  };

  checkPosition = (node = this.state.domNode) => {
    if (f.isNil(node)) {
      return;
    }

    // need real dom node for bounding rect
    // eslint-disable-next-line react/no-find-dom-node
    const rect = ReactDOM.findDOMNode(node).getBoundingClientRect();
    const needsShiftUp = rect.bottom + 265 >= window.innerHeight;
    if (needsShiftUp !== this.state.shiftUp) {
      this.setState({
        shiftUp: needsShiftUp,
        domNode: node
      });
    } else if (f.isNil(this.state.domNode)) {
      this.setState({ domNode: node });
    }
  };

  getStyle = () => ({
    position: "absolute",
    top: this.state.shiftUp ? -265 : "100%"
  });

  clearMoment = () => this.handleChange(null);

  handleChange = momentToSet => {
    const { Formats, actions, table, column, row, langtag, value } = this.props;
    const momentString = momentToSet
      ? momentToSet.format(Formats.formatForServer)
      : null;
    const newValue = column.multilanguage
      ? { [langtag]: momentString }
      : momentString;
    actions.changeCellValue({
      tableId: table.id,
      column,
      columnId: column.id,
      rowId: row.id,
      oldValue: f.isEmpty(value) ? null : value.format(Formats.formatForServe),
      newValue
    });
  };

  render() {
    const { value, Formats } = this.props;
    return (
      <div ref={this.checkPosition}>
        {f.isEmpty(value) ? "" : value.format(Formats.formatForUser)}
        <i className="fa fa-ban" onClick={this.clearMoment} />

        <div
          className="time-picker-wrapper"
          style={this.getStyle()}
          onClick={stopPropagation}
        >
          <Datetime
            onChange={this.handleChange}
            open
            input={false}
            value={value}
          />
        </div>
      </div>
    );
  }
}
export default DateEditCell;
