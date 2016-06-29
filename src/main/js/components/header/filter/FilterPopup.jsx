import React from 'react';
import ReactDOM from 'react-dom';
import ActionCreator from '../../../actions/ActionCreator';
import listensToClickOutside from 'react-onclickoutside/decorator';
import KeyboardShortcutsHelper from '../../../helpers/KeyboardShortcutsHelper';
import TableauxConstants from '../../../constants/TableauxConstants';
import Select from 'react-select';
import {translate, Interpolate} from 'react-i18next';

var ColumnKinds = TableauxConstants.ColumnKinds;

@translate(['filter', 'table'])
@listensToClickOutside()
class FilterPopup extends React.Component {

  static propTypes = {
    langtag : React.PropTypes.string.isRequired,
    onClickedOutside : React.PropTypes.func.isRequired,
    columns : React.PropTypes.object,
    currentFilter : React.PropTypes.object
  };

  selectColumnOptions = null;

  constructor(props) {
    super(props);
    let currFilter = props.currentFilter;

    this.state = {
      selectedFilterColumn : currFilter && _.isFinite(currFilter.filterColumnId) ? currFilter.filterColumnId : null,
      selectedSortColumn : currFilter && _.isFinite(currFilter.sortColumnId) ? currFilter.sortColumnId : null,
      filterValue : currFilter && !_.isEmpty(currFilter.filterValue) ? currFilter.filterValue : ""
    };

    this.buildColumnOptions();
  }

  getColumnOptions() {
    return this.selectColumnOptions || this.buildColumnOptions();
  }

  buildColumnOptions() {
    const {t, langtag} = this.props;
    let options = this.props.columns.reduce(function (res, column) {

      let allowedKinds = column.kind === ColumnKinds.text
        || column.kind === ColumnKinds.shorttext
        || column.kind === ColumnKinds.richtext
        || column.kind === ColumnKinds.numeric
        || column.kind === ColumnKinds.concat
        || column.kind === ColumnKinds.link;

      if (allowedKinds) {
        //Show display name with fallback to machine name
        const columnDisplayName = column.displayName[langtag] || column.name;
        //ID Column gets translated name
        const labelName = column.id === 0 ? t('concat_column_name') : columnDisplayName;

        console.log("pushing label:", labelName, "value: ", column.id);

        res.push({
          label : labelName,
          value : column.id
        });
      }
      return res;

    }, []);
    this.selectColumnOptions = options;
    return options;
  }

  filterInputChange = (event) => {
    this.setState({filterValue : event.target.value});
  };

  filterUpdate = (event) => {
    let selectedFilterColumn = this.state.selectedFilterColumn;
    let selectedSortColumn = this.state.selectedSortColumn;
    //TODO: For now we don't have any sort options
    ActionCreator.changeFilter(selectedFilterColumn, this.state.filterValue, selectedSortColumn, null);
    this.handleClickOutside(event);
  };

  clearFilter = (event) => {
    ActionCreator.clearFilter();
    this.handleClickOutside(event);
  };

  handleClickOutside = (event) => {
    this.props.onClickedOutside(event);
  };

  selectFilterValueRenderer(option) {
    return <div><span>{option.label}</span></div>;
  }

  onChangeSelectFilter = (selection) => {
    console.log("selection: ", selection);
    this.setState({selectedFilterColumn : selection.value});
  };

  onChangeSelectSort = (selection) => {
    this.setState({selectedSortColumn : selection.value});
  };

  getKeyboardShortcuts = (event) => {
    return {
      enter : (event) => {
        this.filterUpdate(event);
      }
    };
  };

  render() {
    let {t} = this.props;

    return (
      <div id="filter-popup">
        <div className="filter-row">
          <Select
            className="filter-select"
            options={this.getColumnOptions()}
            searchable
            clearable={false}
            value={this.state.selectedFilterColumn}
            onChange={this.onChangeSelectFilter}
            valueRenderer={this.selectFilterValueRenderer}
            noResultsText={t('input.noResult')}
            placeholder={t('input.filter')}
          />
          <span className="seperator">{t('help.contains')}</span>
          <input value={this.state.filterValue} type="text" className="filter-input" ref="filterInput"
                 onChange={this.filterInputChange}
                 onKeyDown={KeyboardShortcutsHelper.onKeyboardShortcut(this.getKeyboardShortcuts)}/>
        </div>
        <div className="sort-row">
          <Select
            className="filter-select"
            options={this.getColumnOptions()}
            searchable
            clearable={false}
            value={this.state.selectedSortColumn}
            onChange={this.onChangeSelectSort}
            valueRenderer={this.selectFilterValueRenderer}
            noResultsText={t('input.noResult')}
            placeholder={t('input.sort')}
          />
          <span className="seperator">
             <Interpolate i18nKey="help.sort" linebreak={<br/>}/>
          </span>
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