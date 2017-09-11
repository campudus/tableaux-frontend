import React, {Component} from "react";
import PropTypes from "prop-types";
import SearchFunctions from "../../../helpers/searchFunctions";
import * as f from "lodash/fp";
import KeyboardShortcutsHelper from "../../../helpers/KeyboardShortcutsHelper";
import {either} from "../../../helpers/functools";
import Select from "react-select";
import {translate} from "react-i18next";
import classNames from "classnames";
import FilterModePopup from "./FilterModePopup";
import {FilterModes} from "../../../constants/TableauxConstants";

export const BOOL = "boolean";
export const TEXT = "text";

@translate(["table", "filter"])
class FilterRow extends Component {
  static propTypes = {
    searchableColumns: PropTypes.array.isRequired,
    valueRenderer: PropTypes.func.isRequired,
    onChangeColumn: PropTypes.func.isRequired,
    onChangeValue: PropTypes.func.isRequired,
    onChangeMode: PropTypes.func.isRequired,
    filter: PropTypes.object.isRequired,
    onAddFilter: PropTypes.func,
    onRemoveFilter: PropTypes.func,
    applyFilters: PropTypes.func.isRequired
  };

  constructor(props) {
    super(props);
    this.state = {};
  }

  getKeyboardShortcuts = (event) => {
    const {applyFilters} = this.props;
    return {
      enter: (event) => {
        applyFilters();
      },
      escape: event => {
        this.filterInput.value = "";
      }
    };
  };

  toggleFilterModePopup = () => {
    this.setState({filterModesOpen: !this.state.filterModesOpen});
  };

  renderFilterModePopup = () => {
    const active = (either(this.props.filter)
      .map(f.matchesProperty("filterMode", FilterModes.CONTAINS))
      .getOrElse(true))
      ? 0
      : 1;
    return (
      <FilterModePopup
        active={active}
        close={this.toggleFilterModePopup}
        setFilterMode={this.props.onChangeMode}
      />
    );
  };

  boolInput = () => {
    const isYesSelected = this.props.filter.value;
    const checkboxCss = classNames("checkbox", {"checked": isYesSelected});
    return (
      <span className="bool-input" onClick={this.props.onChangeValue}>
        <div className={checkboxCss}>
        </div>
        <div className="selection-text">
          ({this.props.t((isYesSelected) ? "common:yes" : "common:no")})
        </div>
      </span>
    );
  };

  render() {
    const {filter, onAddFilter, onRemoveFilter, onChangeColumn, onChangeValue, searchableColumns, t, valueRenderer} = this.props;
    const {mode, columnId} = this.props.filter;
    const filterInfoString = either(mode)
      .map(mode => f.prop([mode, "displayName"], SearchFunctions))
      .getOrElse("");
    const filterColumnSelected = f.isInteger(parseInt(columnId)) || f.isString(columnId);
    return (
      <div className="filter-row">
        <Select
          className="filter-select"
          options={searchableColumns}
          searchable={true}
          clearable={false}
          value={columnId}
          onChange={onChangeColumn}
          placeholder={t("input.filter")}
          valueRenderer={valueRenderer}
          noResultsText={t("input.noResult")}
        />
        <span className="separator">{t(filterInfoString)}</span>

        {(filter.columnKind === BOOL)
          ? this.boolInput()
          : (
            <span className="filter-mode-wrapper">
              <input
                value={(f.isString(filter.value)) ? filter.value : ""}
                type="text"
                className="filter-input"
                disabled={!filterColumnSelected}
                ref={fi => {
                  this.filterInput = fi;
                }}
                onChange={onChangeValue}
                onKeyDown={KeyboardShortcutsHelper.onKeyboardShortcut(this.getKeyboardShortcuts)}
                onClick={x => this.filterInput.focus()}
              />
              <span className={"filter-mode-button" + ((this.state.filterModesOpen) ? " active" : "")}>
                {(filterColumnSelected)
                  ? (
                    <a
                      href="#"
                      className={(this.state.filterModesOpen) ? "ignore-react-clickoutside" : ""}
                      onMouseDown={this.toggleFilterModePopup}
                    >
                      <i className="fa fa-search" />
                      <i className="fa fa-caret-down" />
                    </a>
                  )
                  : null}
                {(this.state.filterModesOpen)
                  ? this.renderFilterModePopup()
                  : null
                }
              </span>
            </span>
          )
        }
        {(onRemoveFilter)
          ? (
            <span className="filter-array-button" onClick={onRemoveFilter}>
              <a href="#">
                <i className="fa fa-minus" />
              </a>
            </span>
          )
          : <span className="filter-array-button empty" />
        }
        {(onAddFilter)
          ? (
            <span className="filter-array-button" onClick={onAddFilter}>
              <a href="#">
                <i className="fa fa-plus" />
              </a>
            </span>
          )
          : <span className="filter-array-button empty" />
        }
      </div>);
  }
}

export default FilterRow;
