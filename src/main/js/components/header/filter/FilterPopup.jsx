import React from 'react';
import ReactDOM from 'react-dom';
import ActionCreator from '../../../actions/ActionCreator';
import listensToClickOutside from '../../../../../../node_modules/react-onclickoutside/decorator';
import KeyboardShortcutsHelper from '../../../helpers/KeyboardShortcutsHelper';
import TableauxConstants from '../../../constants/TableauxConstants';
import Select from 'react-select';

var ColumnKinds = TableauxConstants.ColumnKinds;

@listensToClickOutside()
class FilterPopup extends React.Component {

  static propTypes = {
    langtag : React.PropTypes.string.isRequired,
    onClickedOutside : React.PropTypes.func.isRequired,
    columns : React.PropTypes.object,
    currentFilter : React.PropTypes.object
  };

  selectColumnOptions = null;
  preventOutsideClick = false;

  constructor(props) {
    super(props);
    var currFilter = props.currentFilter;
    console.log("props currFilter incoming:", currFilter);

    this.state = {
      selectedFilterColumn : currFilter && currFilter.filterColumnId ? currFilter.filterColumnId : null,
      selectedSortColumn : currFilter && currFilter.sortColumnId ? currFilter.sortColumnId : null,
      filterValue : currFilter && !_.isEmpty(currFilter.filterValue) ? currFilter.filterValue : ""
    };

    this.buildColumnOptions();
  }

  getColumnOptions() {
    return this.selectColumnOptions || this.buildColumnOptions();
  }

  buildColumnOptions() {
    var options = this.props.columns.reduce(function (res, column) {

      var allowedKinds = column.kind === ColumnKinds.text
        || column.kind === ColumnKinds.shorttext
        || column.kind === ColumnKinds.richtext
        || column.kind === ColumnKinds.numeric
        || column.kind === ColumnKinds.concat;

      if (allowedKinds) {
        res.push({
          label : column.name,
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
    var selectedFilterColumn = this.state.selectedFilterColumn || null;
    var selectedSortColumn = this.state.selectedSortColumn || null;
    //debugger;
    //TODO: For now we don't have any sort options
    console.log("filter update:", selectedSortColumn);
    console.log("filter update this.state:", this.state);
    ActionCreator.changeFilter(selectedFilterColumn, this.state.filterValue, selectedSortColumn, null);
  };

  clearFilter = (event) => {
    ActionCreator.clearFilter();
    this.props.onClickedOutside(event);
  };

  onOpenSelect = () => {
    console.log("onOpenSelect");
    this.preventOutsideClick = true;
  };

  handleClickOutside = (event) => {
    console.log("handleClickOutside Popup");
    if (!this.preventOutsideClick) {
      this.props.onClickedOutside(event);
    } else {
      this.preventOutsideClick = false;
    }
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
    var self = this;
    return {
      enter : function (event) {
        console.log("pressing enter in filterpopup");
        self.filterUpdate(event);
      }
    };
  };

  render() {
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
            noResultsText="Keine Spalte mit diesem Namen vorhanden"
            onOpen={this.onOpenSelect}
            placeholder="Filter..."
          />
          <span className="seperator">enthält</span>
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
            noResultsText="Keine Spalte mit diesem Namen vorhanden"
            onOpen={this.onOpenSelect}
            placeholder="Sort..."
          />
          <span className="seperator">sortiert aufsteigend<br/>(A-Z bzw. 0-9)</span>
        </div>
        <div className="description-row">
          <p className="info">
            <span className="text">Filtern und suchen Sie nach Nummern- oder Text-feldern. Links werden derzeit noch nicht
            unterstützt.</span></p>
          <button tabIndex="1" className="neutral" onClick={this.clearFilter}>Filter löschen</button>
          <button tabIndex="0" className="filter-go" onClick={this.filterUpdate}>Filter anwenden</button>
        </div>
      </div>
    )
  }

}

export default FilterPopup;