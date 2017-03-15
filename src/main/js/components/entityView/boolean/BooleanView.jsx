import React from "react";
import {translate} from "react-i18next";

@translate(["common"])
class BooleanView extends Component {

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
    const value = ((cell.isMultiLanguage)
      ? cell.value[this.props.langtag]
      : cell.value)
      || false;

    return (
      <div className='view-content boolean'>
        {value ? t("yes") : t("no")}
      </div>
    );
  }
}

export default translate(["common"])(BooleanView);
