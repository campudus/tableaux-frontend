var React = require('react');
var Select = require('react-select');
var ActionCreator = require('../../actions/ActionCreator.js');
var _ = require('lodash');

var TableSwitcher = React.createClass({

  propTypes : {
    langtag : React.PropTypes.string.isRequired,
    tableName : React.PropTypes.string.isRequired,
    currentTableId : React.PropTypes.number.isRequired,
    tables : React.PropTypes.object.isRequired
  },

  selectOptions : null,

  componentDidMount : function () {
    this.buildSelectOptions();
  },

  getSelectOptions : function () {
    return this.selectOptions || this.buildSelectOptions();
  },

  //TODO: In the future rebuild select options when the table model changed
  buildSelectOptions : function () {
    var options = this.props.tables.reduce(function (res, table) {
      res.push({
        label : table.name,
        value : table.id
      });
      return res;
    }, []);

    this.selectOptions = options;
    return options;
  },

  onChange : function (selection) {
    //prevents undefined tableId: we just want to switch the table when there is actually something selected
    if (!_.isEmpty(selection)) {
      ActionCreator.switchTable(selection.value, this.props.langtag);
    }
  },

  valueRenderer : function (option) {
    var tableName = option.label;
    return <div><i className="fa fa-columns"></i>
      <span>{tableName}</span>
    </div>;
  },

  render : function () {
    console.log("render TableSwitcher");
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