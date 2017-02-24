import React from "react";
import Moment from "moment";
import TableauxConstants from "../../../constants/TableauxConstants";

const DateTimeView = React.createClass({

  displayName: "DateTimeView",

  propTypes: {
    langtag: React.PropTypes.string.isRequired,
    cell: React.PropTypes.object.isRequired
  },

  getValue: function () {
    var cell = this.props.cell;

    var value;
    if (cell.isMultiLanguage) {
      value = cell.value[this.props.langtag];
    } else {
      value = cell.value;
    }

    return typeof value === "undefined" ? null : value;
  },

  getDateTimeValue: function () {
    var cellValue = this.getValue();
    if (cellValue) {
      return Moment(cellValue, TableauxConstants.DateTimeFormats.formatForServer).format(TableauxConstants.DateTimeFormats.formatForUser);
    } else {
      return null;
    }
  },

  render: function () {
    var value = this.getDateTimeValue();

    return (
      <div className='view-content datetime' >
        {value === null ? "" : value}
      </div>
    );
  }
});

export default DateTimeView;
