import React, { Component } from "react";
import PropTypes from "prop-types";
import { FilterModes } from "../../../constants/TableauxConstants";
import i18n from "i18next";
import * as f from "lodash/fp";

class FilterBar extends Component {
  static propTypes = {
    id: PropTypes.number.isRequired
  };

  constructor(props) {
    super(props);
    this.state = {
      value: "",
      filterMode: FilterModes.CONTAINS
    };
  }

  handleInput = event => {
    if (event.key === "Escape" && !f.isEmpty(this.state.value)) {
      event.preventDefault();
      event.stopPropagation();
      this.setState({ value: "" });
      this.props.sharedData.setFilter({
        value: "",
        filterMode: this.state.filterMode
      });
    }
  };

  handleChange = event => {
    const { value } = event.target;
    const { filterMode } = this.state;
    this.setState({ value });
    this.props.sharedData.setFilter({
      value,
      filterMode
    });
  };

  render() {
    const { value } = this.state;
    return (
      <div className="header-filter-bar-wrapper">
        <input
          className="header-filter-bar"
          onChange={this.handleChange}
          onKeyDown={this.handleInput}
          value={value}
          placeholder={i18n.t("table:entity-view-search-placeholder") + "..."}
        />
        <div className="icon-wrapper">
          <i className="fa fa-search" />
        </div>
      </div>
    );
  }
}

export default FilterBar;
