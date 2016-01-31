var React = require('react');
var RowConcatHelper = require('../../helpers/RowConcatHelper');
var App = require('ampersand-app');
var Dispatcher = require('../../dispatcher/Dispatcher.js');

var OverlayHeadRowIdentificator = React.createClass({

  propTypes : {
    cell : React.PropTypes.object,
    langtag : React.PropTypes.string
  },

  rowIdentifierString : "",

  handleTableSwitchClicked : function () {
    Dispatcher.trigger("close-overlay");

    //FIXME Do this with a global event to cleanup models and listeners!
    App.router.history.navigate(this.props.langtag + '/table/' + this.props.cell.column.toTable, {trigger : true});
  },

  componentWillMount : function () {

    var cell = this.props.cell;
    var tableId = cell.tableId;
    var table = cell.tables.get(tableId);
    var tableColumns = table.columns;
    var tableRows = table.rows;
    var currentRow = tableRows.get(cell.rowId);
    var idColumn = tableColumns.at(0);
    var idCellValue = currentRow.values[0];
    this.rowIdentifierString = RowConcatHelper.getRowConcatStringWithFallback(idCellValue, idColumn, this.props.langtag);

  },

  render : function () {

    var rowIdentification = null;
    if (this.rowIdentifierString !== "") {
      rowIdentification = <span className="row-identification-value">{this.rowIdentifierString}</span>;
    }

    if (this.props.cell != null) {
      if (this.props.cell.isLink) {
        return (
          <span>
            <span onClick={this.handleTableSwitchClicked} className="column-name with-link">
              <i className="fa fa-columns"></i>{this.props.cell.column.name}</span>{rowIdentification}
          </span>
        );

      } else {
        return (
          <span>
            <span className="column-name">{this.props.cell.column.name}: </span>{rowIdentification}
          </span>
        );

      }
    } else {
      return null;
    }
  }

});

module.exports = OverlayHeadRowIdentificator;
