import React from 'react';
import ReactDOM from 'react-dom';
import ActionCreator from '../../../actions/ActionCreator';
import listensToClickOutside from '../../../../../../node_modules/react-onclickoutside/decorator';
import KeyboardShortcutsMixin from '../../mixins/KeyboardShortcutsMixin';
import TableauxConstants from '../../../constants/TableauxConstants';
import Select from 'react-select';

var ColumnKinds = TableauxConstants.ColumnKinds;

//@KeyboardShortcutsMixin()
@listensToClickOutside()
class FilterPopup extends React.Component {

  static propTypes = {
    langtag : React.PropTypes.string.isRequired,
    onClickedOutside : React.PropTypes.func.isRequired,
    columns : React.PropTypes.object,
    currentFilter : React.PropTypes.object
  };

  //TODO Set currentFilter values
  state = {
    selectedFilterColumn : null,
    selectedSortColumn : null
  };

  filterValue = "";
  sortValue = "";
  selectColumnOptions = null;
  preventOutsideClick = false;

  constructor(props) {
    super(props);
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
    this.filterValue = event.target.value;
    console.log("filterChange:", this.filterValue);
  }

  sortInputChange = (event) => {
    this.sortValue = event.target.value;
    console.log("filterChange:", this.sortValue);
  }

  filterUpdate(event) {
    ActionCreator.changeFilter(this.state.selectedFilterColumn.value, this.filterValue,
      this.state.selectedSortColumn.value, this.sortValue);
  }

  onOpenSelect = () => {
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
    this.setState({selectedFilterColumn : selection});
  };

  onChangeSelectSort = (selection) => {
    this.setState({selectedSortColumn : selection});
  };

  getKeyboardShortcuts(event) {
    var self = this;
    return {
      enter : function (event) {
        self.filterUpdate(event);
      }
    };
  }


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
          />
          <span className="seperator">enthält</span>
          <input type="text" className="filter-input" ref="filterInput" onChange={this.filterInputChange}
                 onKeyDown={this.onKeyboardShortcut}/>
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
          />
          <span className="seperator">sortiert</span>
          <input type="text" className="filter-input" ref="filterInput" onChange={this.sortInputChange}
                 onKeyDown={this.onKeyboardShortcut}/>
        </div>
        <div className="description-row">
          <p className="info">
            <span className="text">Filtern und suchen Sie nach Nummern- oder Text-feldern. Links werden derzeit noch nicht
            unterstützt.</span></p>
          <button onClick={this.filterUpdate.bind(this)}>Filter anwenden</button>
        </div>
      </div>
    )
  }

}

export default FilterPopup;