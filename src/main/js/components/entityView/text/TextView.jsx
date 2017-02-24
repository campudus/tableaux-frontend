import React from "react";

class TextView extends React.Component {

  displayName: "TextView",

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

  render: function () {
    var value = this.getValue();

    return (
      <div className='view-content text' >
        {value === null ? "" : value}
      </div>
    );
  }
}

export default TextView;
