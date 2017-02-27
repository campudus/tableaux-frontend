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
    cell.save(changes, {isPatch: true});
  };

  render() {
    const {cell, t} = this.props;
    const value = ((cell.isMultiLanguage)
      ? cell.value[this.props.langtag]
      : cell.value)
      || false;

    return (
      <div className="view-content boolean" onClick={this.toggleValue}>
        {value ? t("yes") : t("no")}
      </div>
    );
  }
}

export default BooleanView;
