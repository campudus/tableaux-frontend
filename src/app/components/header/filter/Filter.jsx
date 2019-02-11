import React from "react";
import FilterPopup from "./FilterPopup.jsx";
import { translate } from "react-i18next";
import { FilterModes } from "../../../constants/TableauxConstants";
import classNames from "classnames";
import { either } from "../../../helpers/functools";
import * as f from "lodash/fp";
import PropTypes from "prop-types";

class FilterButton extends React.Component {
  static propTypes = {
    langtag: PropTypes.string.isRequired,
    table: PropTypes.object.isRequired,
    currentFilter: PropTypes.object
  };

  state = {
    open: false,
    filterMode: either(this.props.currentFilter)
      .map(f.prop(["filterMode"]))
      .getOrElse(FilterModes.CONTAINS)
  };

  constructor(props) {
    super(props);
    this.state = {
      open: false
    };
  }

  handleClickedOutside = event => {
    this.setState({ open: false });
  };

  renderFilterPopup() {
    const {
      currentFilter,
      columns,
      langtag,
      filterActions,
      filters,
      sorting,
      preparedRows
    } = this.props;
    if (this.state.open) {
      return (
        <FilterPopup
          langtag={langtag}
          onClickedOutside={this.handleClickedOutside}
          columns={columns}
          currentFilter={currentFilter}
          filterActions={filterActions}
          filters={filters}
          sorting={sorting}
          preparedRows={preparedRows}
        />
      );
    } else {
      return null;
    }
  }

  toggleFilter = event => {
    event.preventDefault();
    this.setState({ open: !this.state.open });
  };

  render() {
    const { t, currentFilter } = this.props;
    const { open } = this.state;

    let buttonClass = "button";
    if (open) {
      buttonClass += " ignore-react-onclickoutside";
    }

    const cssClass = classNames({
      active: open,
      "has-filter":
        !f.isEmpty(currentFilter) &&
        (!f.isEmpty(currentFilter.filters) ||
          f.isInteger(currentFilter.sortColumnId)) &&
        !open
    });

    return (
      <div id="filter-wrapper" className={cssClass}>
        <a href="#" className={buttonClass} onClick={this.toggleFilter}>
          <i className="fa fa-filter" />
          {t("button.title")}
        </a>
        {this.renderFilterPopup()}
      </div>
    );
  }
}

export default translate(["filter"])(FilterButton);
