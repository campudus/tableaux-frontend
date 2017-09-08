import React, {PureComponent} from "react";
import PropTypes from "prop-types";
import ActionCreator from "../../../actions/ActionCreator";
import "react-virtualized/styles.css";
import i18n from "i18next";
import {FilterModes} from "../../../constants/TableauxConstants";
import * as f from "lodash/fp";
import SearchFunctions, {SEARCH_FUNCTION_IDS} from "../../../helpers/searchFunctions";
import classNames from "classnames";
import listensToClickOutside from "react-onclickoutside";

@listensToClickOutside
class SearchBar extends PureComponent {
  static propTypes = {
    langtag: PropTypes.string.isRequired,
    id: PropTypes.number.isRequired
  };

  constructor(props) {
    super(props);
    this.state = {
      filterValue: "",
      filterMode: FilterModes.CONTAINS
    };
  }

  updateFilter = ({mode, value}) => {
    const {filterMode, filterValue} = this.state;
    const newValue = {
      filterMode: mode || filterMode,
      filterValue: (f.isString(value)) ? value : filterValue,
      popupOpen: false
    };
    this.setState(newValue, () => ActionCreator.filterLinksInOverlay(newValue));
  };

  handleClickOutside = event => {
    this.setState({popupOpen: false});
  };

  renderSearchOptions = () => {
    const {popupOpen, filterMode} = this.state;
    const activeIndex = f.findIndex(f.eq(filterMode), SEARCH_FUNCTION_IDS);
    return (popupOpen)
      ? (
        <div className="filter-option-popup">
          {
            SEARCH_FUNCTION_IDS.map(
              (id, idx) => {
                const name = i18n.t(SearchFunctions[id].displayName);
                const itemClass = classNames("menu-item", {"active": idx === activeIndex});
                return (
                  <div className={itemClass} key={id}>
                    <a className="menu-item-inner" href="#" onClick={() => this.updateFilter({mode: id})}>
                      {name}
                    </a>
                  </div>
                );
              }
            )
          }
        </div>
      )
      : null;
  };

  handleInputKeys = event => {
    const clearOrClose = () => {
      if (!f.isEmpty(this.state.filterValue)) {
        this.setState({filterValue: ""},
          () => this.updateFilter({
            mode: this.state.filterMode,
            value: this.state.filterValue
          }));

        event.preventDefault();
        event.stopPropagation();
      }
    };

    const passOnKey = () => {
      event.preventDefault();
      ActionCreator.passOnKeyStrokes({
        id: this.props.id,
        event
      });
    };

    const isIn = x => y => f.contains(f.toLower(y), f.map(f.toLower, x));

    f.cond([
      [f.eq("Escape"), clearOrClose],
      [isIn(["arrowup", "arrowdown", "tab", "enter"]), passOnKey],
      [f.stubTrue, f.noop]
    ])(event.key);
  };

  render() {
    const {filterMode, filterValue, popupOpen} = this.state;
    const filterName = i18n.t(SearchFunctions[filterMode].displayName);

    return (
      <div className="filter-bar">
        <input type="text"
               className="header-input"
               autoFocus
               value={filterValue}
               placeholder={filterName}
               onKeyDown={this.handleInputKeys}
               onChange={event => this.updateFilter({value: event.target.value})}
        />
        <a href="#" className="popup-button" onClick={() => this.setState({popupOpen: !popupOpen})}>
          <i className="fa fa-search" />
          <i className="fa fa-angle-down" />
        </a>
        {this.renderSearchOptions()}
      </div>
    );
  }
}

export default SearchBar;
