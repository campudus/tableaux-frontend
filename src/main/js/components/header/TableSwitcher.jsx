import React from 'react';
import Select from 'react-select';
import ActionCreator from '../../actions/ActionCreator.js';
import _ from 'lodash';

const TableSwitcher = React.createClass({

  propTypes : {
    langtag : React.PropTypes.string.isRequired,
    tableName : React.PropTypes.string.isRequired,
    currentTableId : React.PropTypes.number.isRequired,
    tables : React.PropTypes.object.isRequired
  },

  selectOptions : null,

  componentDidMount() {
    this.buildSelectOptions();
  },

  getSelectOptions() {
    return this.selectOptions || this.buildSelectOptions();
  },

  //TODO: In the future rebuild select options when the table model changed
  buildSelectOptions() {
    const {langtag} = this.props;
    const options = this.props.tables.reduce(function (res, table) {
      res.push({
        label : typeof table.displayName[langtag] === "undefined" ? table.name : table.displayName[langtag],
        value : table.id
      });
      return res;
    }, []);

    this.selectOptions = options;
    return options;
  },

  onChange(selection) {
    //prevents undefined tableId: we just want to switch the table when there is actually something selected
    if (!_.isEmpty(selection)) {
      ActionCreator.switchTable(selection.value, this.props.langtag);
    }
  },

  valueRenderer(option) {
    const tableName = option.label;
    return (
      <div><i className="fa fa-columns"></i>
        <span>{tableName}</span>
      </div>
    );
  },

  render() {
    return (
      <div id="table-switcher">
        <Select options={this.getSelectOptions()}
                searchable
                clearable={false}
                value={this.props.currentTableId}
                onChange={this.onChange}
                valueRenderer={this.valueRenderer}
                noResultsText="Keine Tabelle mit diesem Namen vorhanden"
        />
      </div>
    )
  }
});

module.exports = TableSwitcher;
