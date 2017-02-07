import React from "react";
import FilterPopup from "./FilterPopup.jsx";
import {translate} from "react-i18next";
import * as f from "lodash/fp";
import {FilterModes} from "../../../constants/TableauxConstants";
import {either} from "../../../helpers/monads";

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
  }

  handleClickedOutside = (event) => {
    this.setState({open: false});
  };

  setFilterMode = mode_string => {
    this.setState(
      {filterMode: mode_string});
  };

  renderFilterPopup() {
    const plannedFilter = f.set(["filterMode"], this.state.filterMode, this.props.currentFilter);
    if (this.state.open) {
      return (
        <FilterPopup filterMode={this.state.filterMode}
                     setFilterMode={this.setFilterMode}
                     langtag={this.props.langtag} onClickedOutside={this.handleClickedOutside}
                     columns={this.props.table.columns} currentFilter={plannedFilter} />
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

    const css_class = f.compose(
      f.first,
      f.find(x => x[1]),
      f.zip(["active", "has-filter", ""])
    )([this.state.open, this.props.currentFilter, true])

    return (
      <div id="filter-wrapper" className={css_class}>
        <a href="#" className={buttonClass} onClick={this.toggleFilter}>
          <i className="fa fa-filter"></i>{t('button.title')}</a>
        {this.renderFilterPopup()}
      </div>
    )
  }

}

export default translate(['filter'])(FilterButton);