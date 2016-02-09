var React = require('react');
var Select = require('react-select');
var ActionCreator = require('../../actions/ActionCreator.js');

var LanguageSwitcher = React.createClass({

  propTypes : {
    langtag : React.PropTypes.string.isRequired,
    tableName : React.PropTypes.string.isRequired,
    currentTableId : React.PropTypes.number.isRequired,
    tables : React.PropTypes.object.isRequired
  },

  onChange : function (option) {
    ActionCreator.switchTable(option.value, this.props.langtag);
  },

  renderOption : function (option) {
    var tableName = option.label;
    return <div><i className="fa fa-columns"></i>
      <span>{tableName}</span>
    </div>;
  },

  renderValue : function (option) {
    var tableName = option.label;
    return <div className="table-option">
      <span>{tableName}</span>
    </div>;
  },

  render : function () {
    var options = this.props.tables.reduce(function (res, table) {
      res.push({
        label : table.name,
        value : table.id
      });
      return res;
    }, []);

    return (
      <div id="table-switcher">
        <Select options={options}
                searchable
                clearable={false}
                value={this.props.currentTableId}
                onChange={this.onChange}
                optionRenderer={this.renderValue}
                valueRenderer={this.renderOption}
                noResultsText="Keine Tabelle mit diesem Namen vorhanden"

        />
      </div>
    )
  }
});

module.exports = LanguageSwitcher;