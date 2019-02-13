import React from "react";
import FilterPopup from "./FilterPopup.jsx";
import { translate } from "react-i18next";
import { FilterModes } from "../../../constants/TableauxConstants";
import classNames from "classnames";
import { either } from "../../../helpers/functools";
import * as f from "lodash/fp";
import PropTypes from "prop-types";

class FilterButton extends React.PureComponent {
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

  handleClickedOutside = () => {
    this.setState({ open: false });
  };

  renderFilterPopup() {
    const {
      currentFilter,
      columns,
      langtag,
      filterActions,
      setRowFilter
    } = this.props;
    if (this.state.open) {
      return (
        <FilterPopup
          langtag={langtag}
          onClickedOutside={this.handleClickedOutside}
          columns={columns}
          currentFilter={currentFilter}
          filterActions={filterActions}
          setRowFilter={setRowFilter}
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

FilterButton.propTypes = {
  langtag: PropTypes.string.isRequired,
  columns: PropTypes.array, // required to open popup, but nil if not loaded yet
  table: PropTypes.object.isRequired,
  currentFilter: PropTypes.object,
  setRowFilter: PropTypes.func.isRequired
};
