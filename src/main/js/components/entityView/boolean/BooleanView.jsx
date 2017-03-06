import React, {Component, PropTypes} from "react";
import {translate} from "react-i18next";

@translate(["common"])
class BooleanView extends Component {

  constructor(props) {
    super(props);
    this.displayName = "BooleanView";
  }

  static propTypes = {
    langtag: PropTypes.string.isRequired,
    cell: PropTypes.object.isRequired,
    t: PropTypes.func.isRequired
  };

  toggleValue = event => {
    const {cell, langtag} = this.props;
    const changes = (cell.isMultiLanguage)
      ? {value: {[langtag]: !cell.value[langtag]}}
      : {value: !cell.value};
    cell.save(changes, {patch: true});
  };

  toggleOnEnter = event => {
    if (event.key === "Enter") {
      this.toggleValue();
      event.stopPropagation();
    }
  };

  render() {
    const {cell, t, tabIdx} = this.props;
    const value = ((cell.isMultiLanguage)
      ? cell.value[this.props.langtag]
      : cell.value)
      || false;

    return (
        <div className="view-content view-boolean" onClick={this.toggleValue} tabIndex={tabIdx} onKeyDown={this.toggleOnEnter} ref={this.focusTarget = el} >
        <input type="checkbox" checked={value} readOnly />
        {value ? t("yes") : t("no")}
      </div>
    );
  }
}

export default BooleanView;
