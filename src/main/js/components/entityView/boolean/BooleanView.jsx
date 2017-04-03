import React, {Component, PropTypes} from "react";
import {translate} from "react-i18next";
import classNames from "classnames";

@translate(["common"])
class BooleanView extends Component {

  static propTypes = {
    langtag: PropTypes.string.isRequired,
    cell: PropTypes.object.isRequired,
    t: PropTypes.func.isRequired
  };

  constructor(props) {
    super(props);
    const {langtag, cell:{value,isMultiLanguage}} = props;
    this.state = {selected: (isMultiLanguage) ? value[langtag] : value};
  }

  toggleValue = event => {
    event.preventDefault();
    event.stopPropagation();
    const {cell, langtag} = this.props;
    const newValue = !this.state.selected;
    const changes = (cell.isMultiLanguage)
      ? {value: {[langtag]: newValue}}
      : {value: newValue};
    this.setState({selected: newValue});
    cell.save(changes, {patch: true});
  };

  toggleOnEnter = event => {
    if (event.key === "Enter") {
      this.toggleValue();
      event.stopPropagation();
    }
  };

  render() {
    const {t, tabIdx} = this.props;
    const {selected} = this.state;
    const checkboxCss = classNames("checkbox", {"checked": selected});

    return (
        <div className="item-content boolean" onClick={this.toggleValue} tabIndex={tabIdx} onKeyDown={this.toggleOnEnter}>
        <div className={checkboxCss}>
          {(selected)
            ? <i className="fa fa-check" />
            : ""
          }
        </div>
          <div className="value">{`${t("current_selection")}: `}{selected ? t("yes") : t("no")}</div>
      </div>
    );
  }
}

export default BooleanView;
