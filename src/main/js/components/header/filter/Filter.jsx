import React from "react";
import FilterPopup from "./FilterPopup.jsx";
import {translate} from "react-i18next";
import {FilterModes} from "../../../constants/TableauxConstants";
import classNames from "classnames";
import {either} from "../../../helpers/monads";
import * as f from "lodash/fp";

class FilterButton extends React.Component {

  static propTypes = {
    langtag: React.PropTypes.string.isRequired,
    table: React.PropTypes.object.isRequired,
    currentFilter: React.PropTypes.object
  };

  state = {
    open: false,
    filterMode: either(this.props.currentFilter).map(f.prop(["filterMode"])).getOrElse(FilterModes.CONTAINS)
  };

  constructor(props) {
    super(props);
    this.state = {
      open: false
    };
  }

  handleClickedOutside = (event) => {
    this.setState({open: false});
  };

  renderFilterPopup() {
    const {currentFilter, table: {columns}, langtag} = this.props;
    if (this.state.open) {
      return (
        <FilterPopup langtag={langtag} onClickedOutside={this.handleClickedOutside}
                     columns={columns} currentFilter={currentFilter} />
      );
    } else {
      return null;
    }
  }

  toggleFilter = (event) => {
    event.preventDefault();
    this.setState({open: !this.state.open});
  };

  render() {
    let {t} = this.props;
    let buttonClass = "button";
    if (this.state.open) {
      buttonClass += " ignore-react-onclickoutside";
    }

    const cssClass = classNames({
      "active": this.state.open,
      "has-filter": !f.isEmpty(this.props.currentFilter) && !this.state.open
    });

    return (
      <div id="filter-wrapper" className={cssClass}>
        <a href="#" className={buttonClass} onClick={this.toggleFilter}>
          <i className="fa fa-filter" />{t("button.title")}</a>
        {this.renderFilterPopup()}
      </div>
    );
  }
}

export default translate(["filter"])(FilterButton);
