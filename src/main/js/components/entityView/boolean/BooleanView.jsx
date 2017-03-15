import React from "react";
import {translate} from "react-i18next";

const BooleanView = React.createClass({

  displayName: "BooleanView",

  propTypes: {
    langtag: React.PropTypes.string.isRequired,
    cell: React.PropTypes.object.isRequired,
    t: React.PropTypes.func.isRequired
  },

  getValue: function (cell) {
    var value;
    if (cell.isMultiLanguage) {
      value = cell.value[this.props.langtag];
    } else {
      value = cell.value;
    }

    return typeof value === "undefined" ? null : value;
  },

  render: function () {
    const {cell, t} = this.props;
    var value = this.getValue(cell);

    return (
      <div className='view-content boolean'>
        {value ? t("yes") : t("no")}
      </div>
    );
  }
});

export default translate(["common"])(BooleanView);
