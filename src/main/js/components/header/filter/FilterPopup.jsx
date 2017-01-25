import React from "react";
import * as _ from "lodash";
import ActionCreator from "../../../actions/ActionCreator";
import listensToClickOutside from "react-onclickoutside";
import KeyboardShortcutsHelper from "../../../helpers/KeyboardShortcutsHelper";
import Select from "react-select";
import FilterModePopup from "./FilterModePopup";
import {translate} from "react-i18next";
import TableauxConstants, {FilterModes, ColumnKinds} from "../../../constants/TableauxConstants";

@translate(['filter', 'table'])
@listensToClickOutside
class FilterPopup extends React.Component {

  static propTypes = {
    langtag: React.PropTypes.string.isRequired,
    onClickedOutside: React.PropTypes.func.isRequired,
    columns: React.PropTypes.object,
    currentFilter: React.PropTypes.object
  };

  static isSortableColumn = (column) => {
    return column.kind === ColumnKinds.text
      || column.kind === ColumnKinds.shorttext
      || column.kind === ColumnKinds.richtext
      || column.kind === ColumnKinds.numeric
      || column.kind === ColumnKinds.concat
      || column.kind === ColumnKinds.link
      || column.kind === ColumnKinds.boolean;
  };

  static isSearchableColumn = (column) => {
    return column.kind === ColumnKinds.text
      || column.kind === ColumnKinds.shorttext
      || column.kind === ColumnKinds.richtext
      || column.kind === ColumnKinds.numeric
      || column.kind === ColumnKinds.concat
      || column.kind === ColumnKinds.link;
  };

  sortableColumns = null;
  searchableColumns = null;

  constructor(props) {
    super(props);

    let currFilter = props.currentFilter;

    this.state = {
      selectedFilterColumn: currFilter && _.isFinite(currFilter.filterColumnId) ? currFilter.filterColumnId : null,
      selectedSortColumn: currFilter && _.isFinite(currFilter.sortColumnId) ? currFilter.sortColumnId : null,
      filterValue: currFilter && !_.isEmpty(currFilter.filterValue) ? currFilter.filterValue : "",
      sortValue: currFilter && !_.isEmpty(currFilter.sortValue)
        ? currFilter.sortValue
        : TableauxConstants.SortValues.ASC,
      filterModesOpen: false,
      filterMode: FilterModes.CONTAINS
    };

    this.sortableColumns = this.buildColumnOptions(FilterPopup.isSortableColumn);
    this.searchableColumns = this.buildColumnOptions(FilterPopup.isSearchableColumn);
  }

  getSortableColumns() {
    return this.sortableColumns || (this.sortableColumns = this.buildColumnOptions(FilterPopup.isSortableColumn()));
  }

  getSearchableColumns() {
    return this.searchableColumns || (this.searchableColumns = this.buildColumnOptions(FilterPopup.isSearchableColumn()));
  }

  buildColumnOptions(filterFn) {
    const {t, columns, langtag} = this.props;

    return _.map(_.filter(columns.models, filterFn), (column) => {
      // Show display name with fallback to machine name
      const columnDisplayName = column.displayName[langtag] || column.name;
      // ID Column gets translated name
      const labelName = column.id === 0 ? t('concat_column_name') : columnDisplayName;

      return {
        label: labelName,
        value: column.id
      };
    });
  }

  getSortOptions() {
    const {t} = this.props;

    return [
      {
        label: t("help.sortasc"),
        value: TableauxConstants.SortValues.ASC
      },
      {
        label: t("help.sortdesc"),
        value: TableauxConstants.SortValues.DESC
      }
    ]
  }

  filterInputChange = (event) => {
    this.setState({filterValue: event.target.value});
  };

  filterUpdate = (event) => {
    const {selectedFilterColumn, selectedSortColumn} = this.state;

    ActionCreator.changeFilter(selectedFilterColumn,
      this.state.filterValue,
      this.state.filterMode,
      selectedSortColumn,
      this.state.sortValue);
    this.handleClickOutside(event);
  };

  clearFilter = (event) => {
    ActionCreator.clearFilter();
    this.handleClickOutside(event);
  };

  handleClickOutside = (event) => {
    this.props.onClickedOutside(event);
  };

  selectFilterValueRenderer = (option) => {
    return <div><span>{option.label}</span></div>;
  };

  selectSortValueRenderer = (option) => {
    if (option.value === TableauxConstants.SortValues.ASC) {
      return <div><i className="fa fa-sort-alpha-asc"></i> {option.label}</div>
    } else {
      return <div><i className="fa fa-sort-alpha-desc"></i> {option.label}</div>
    }
  };

  onChangeSelectFilter = (selection) => {
    console.log("selection: ", selection);
    this.setState({selectedFilterColumn: selection.value});
  };

  onChangeSelectSortColumn = (selection) => {
    this.setState({selectedSortColumn: selection.value});
  };

  onChangeSelectSortValue = (selection) => {
    this.setState({sortValue: selection.value});
  };

  getKeyboardShortcuts = (event) => {
    return {
      enter: (event) => {
        this.filterUpdate(event);
      }
    };
  };

  toggleFilterModePopup = () => {
    this.setState({filterModesOpen: !this.state.filterModesOpen});
  };

  renderFilterModePopup = () => {
    return <FilterModePopup x={0} y={0}
                            close={this.toggleFilterModePopup}
                            setFilterMode={this.setFilterMode} />
  };

  setFilterMode = mode_string => {
    this.setState({filterMode: mode_string});
  };

  render() {
    let {t} = this.props;

    return (
      <div id="filter-popup">
        <div className="filter-row">
          <Select
            className="filter-select"
            options={this.getSearchableColumns()}
            searchable={true}
            clearable={false}
            value={this.state.selectedFilterColumn}
            onChange={this.onChangeSelectFilter}
            valueRenderer={this.selectFilterValueRenderer}
            noResultsText={t('input.noResult')}
            placeholder={t('input.filter')}
          />
          <span className="separator">{t('help.contains')}</span>
          <input value={this.state.filterValue} type="text" className="filter-input" ref="filterInput"
                 onChange={this.filterInputChange}
                 onKeyDown={KeyboardShortcutsHelper.onKeyboardShortcut(this.getKeyboardShortcuts)} />
          <span style={{position: "relative"}}>
            <a href="#"
               className="ignore-react-clickoutside"
               onClick={this.toggleFilterModePopup}>
              <i className="fa fa-search-plus" />
            </a>
            {(this.state.filterModesOpen)
              ? this.renderFilterModePopup()
              : null
            }
          </span>
        </div>
        <div className="sort-row">
          <Select
            className="filter-select"
            options={this.getSortableColumns()}
            searchable={true}
            clearable={false}
            value={this.state.selectedSortColumn}
            onChange={this.onChangeSelectSortColumn}
            valueRenderer={this.selectFilterValueRenderer}
            noResultsText={t('input.noResult')}
            placeholder={t('input.sort')}
          />
          <span className="separator">{t('help.sort')}</span>
          <Select
            className="filter-select"
            options={this.getSortOptions()}
            searchable={true}
            clearable={false}
            value={this.state.sortValue}
            onChange={this.onChangeSelectSortValue}
            valueRenderer={this.selectSortValueRenderer}
            optionRenderer={this.selectSortValueRenderer}
            noResultsText={t('input.noResult')}
          />
        </div>
        <div className="description-row">
          <p className="info">
            <span className="text">{t('help.note')}</span></p>
          <button tabIndex="1" className="neutral"
                  onClick={this.clearFilter}>{t('button.clearFilter')}</button>
          <button tabIndex="0" className="filter-go"
                  onClick={this.filterUpdate}>{t('button.doFilter')}</button>
        </div>
      </div>
    )
  }

}

export default FilterPopup;