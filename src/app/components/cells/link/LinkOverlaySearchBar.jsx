import React, { Component } from "react";
import PropTypes from "prop-types";
import "react-virtualized/styles.css";
import i18n from "i18next";
import { FilterModes } from "../../../constants/TableauxConstants";
import * as f from "lodash/fp";
import SearchFunctions, {
  SEARCH_FUNCTION_IDS
} from "../../../helpers/searchFunctions";
import classNames from "classnames";
import listensToClickOutside from "react-onclickoutside";
import {
  when,
  stopPropagation,
  preventDefault,
  maybe
} from "../../../helpers/functools";

@listensToClickOutside
class SearchBar extends Component {
  static propTypes = {
    langtag: PropTypes.string.isRequired,
    id: PropTypes.number.isRequired
  };

  constructor(props) {
    super(props);
    this.state = {
      popupOpen: false
    };
  }

  componentDidMount = () => {
    this.props.updateSharedData(f.assoc("focusInput", this.focusInput));
  };

  updateFilter = ({ mode, value }) => {
    const { filterMode, filterValue } = this.props;
    if (mode !== filterMode) {
      this.props.setFilterMode(mode);
    }
    if (value !== filterValue) {
      this.props.setFilterValue(value);
    }
    this.setState({ popupOpen: false });
  };

  handleClickOutside = () => {
    this.setState({ popupOpen: false });
  };

  renderSearchOptions = () => {
    const { popupOpen } = this.state;
    const { filterMode } = this.props;
    const activeIndex = when(f.gt(0), f.always(0))(
      f.findIndex(f.eq(filterMode), SEARCH_FUNCTION_IDS)
    );
    return popupOpen ? (
      <div className="filter-option-popup">
        {SEARCH_FUNCTION_IDS.map((id, idx) => {
          const name = i18n.t(SearchFunctions[id].displayName);
          const itemClass = classNames("menu-item", {
            active: idx === activeIndex
          });
          return (
            <div className={itemClass} key={id}>
              <a
                className="menu-item-inner"
                href="#"
                onClick={() => this.updateFilter({ mode: id })}
              >
                {name}
              </a>
            </div>
          );
        })}
      </div>
    ) : null;
  };

  handleInputKeys = event => {
    const clearOrClose = () => {
      if (!f.isEmpty(this.props.filterValue)) {
        this.props.setFilterValue({ value: "" });

        preventDefault(event);
        stopPropagation(event);
      }
    };

    const passOnKey = event => {
      preventDefault(event);
      stopPropagation(event);
      this.props.onKeystroke(event);
      this.focusInput();
    };

    const isIn = x => y => f.contains(f.toLower(y), f.map(f.toLower, x));

    f.cond([
      [f.eq("Escape"), () => clearOrClose],
      [isIn(["arrowup", "arrowdown", "tab", "enter"]), () => passOnKey],
      [f.stubTrue, () => f.noop]
    ])(event.key)(event);
  };

  saveRef = ref => {
    this.inputField = ref;
  };

  focusInput = () => {
    maybe(this.inputField).method("focus");
  };

  render() {
    const { popupOpen } = this.state;
    const { filterMode, filterValue } = this.props;
    const filterName = i18n.t(
      SearchFunctions[filterMode || FilterModes.CONTAINS].displayName
    );

    return (
      <div className="filter-bar">
        <input
          ref={this.saveRef}
          type="text"
          className="header-input"
          autoFocus
          value={filterValue}
          placeholder={filterName}
          onKeyDown={this.handleInputKeys}
          onChange={event => this.updateFilter({ value: event.target.value })}
        />
        <a
          href="#"
          className="popup-button"
          onClick={() => this.setState({ popupOpen: !popupOpen })}
        >
          <i className="fa fa-search" />
          <i className="fa fa-angle-down" />
        </a>
        {this.renderSearchOptions()}
      </div>
    );
  }
}

export default SearchBar;
