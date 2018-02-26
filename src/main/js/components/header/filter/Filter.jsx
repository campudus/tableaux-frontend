import React from "react";
import FilterPopup from "./FilterPopup.jsx";
import {translate} from "react-i18next";
import {FilterModes, ActionTypes} from "../../../constants/TableauxConstants";
import classNames from "classnames";
import {either} from "../../../helpers/functools";
import * as f from "lodash/fp";
import PropTypes from "prop-types";
import Dispatcher from "../../../dispatcher/Dispatcher";

class FilterButton extends React.Component {
  static propTypes = {
    langtag: PropTypes.string.isRequired,
    table: PropTypes.object.isRequired,
    currentFilter: PropTypes.object
  };

  state = {
    open: false,
    filterMode: either(this.props.currentFilter).map(f.prop(["filterMode"])).getOrElse(FilterModes.CONTAINS)
  };

  componentWillMount() {
    Dispatcher.on(ActionTypes.OPEN_FILTERS, this.openPopup);
  }

  componentWillUnmount() {
    Dispatcher.off(ActionTypes.OPEN_FILTERS, this.closePopup);
  }

  constructor(props) {
    super(props);
    this.state = {
      open: false
    };
  }

  openPopup = () => {
    if (!this.state.open) {
      this.setState({open: true});
    }
  };

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
    const {t, currentFilter} = this.props;
    const {open} = this.state;

    let buttonClass = "button";
    if (open) {
      buttonClass += " ignore-react-onclickoutside";
    }

    const cssClass = classNames({
      "active": open,
      "has-filter": !f.isEmpty(currentFilter)
        && (!f.isEmpty(currentFilter.filters) || f.isInteger(currentFilter.sortColumnId))
        && !open
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
