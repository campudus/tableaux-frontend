import React, {Component, PropTypes} from "react";
import ActionCreator from "../../../actions/ActionCreator";
import {FilterModes} from "../../../constants/TableauxConstants";
import SearchFunctions from "../../../helpers/searchFunctions";
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
    }
  }

  handleInput = event => {
    if (event.key === "Escape" && !f.isEmpty(this.state.value)) {
      event.preventDefault();
      event.stopPropagation();
      this.setState({value: ""});
      ActionCreator.filterEntityView({
        id: this.props.id,
        value: "",
        filterMode: this.state.filterMode
      });
    }
  };

  handleChange = event => {
    const {value} = event.target;
    const {id} = this.props;
    const {filterMode} = this.state;
    this.setState({value});
    ActionCreator.filterEntityView({
      id,
      value,
      filterMode
    });
  };

  render() {
    const {value, filterMode} = this.state;
    const modeString = SearchFunctions[filterMode].displayName;
    return <input className="header-filter-bar"
                  onChange={this.handleChange}
                  onKeyDown={this.handleInput}
                  value={value}
                  placeholder={i18n.t(modeString) + "..."}
    />
  }
}

export default FilterBar;