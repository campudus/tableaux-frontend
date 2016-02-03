var React = require('react');
var RowConcatHelper = require('../../helpers/RowConcatHelper');
var App = require('ampersand-app');
var ActionCreator = require('../../actions/ActionCreator');


var OverlayHeadRowIdentificator = React.createClass({

  propTypes : {
    cell : React.PropTypes.object,
    langtag : React.PropTypes.string
  },

  rowIdentifierString : "",

  handleTableSwitchClicked : function () {
    ActionCreator.closeOverlay();
    ActionCreator.switchTable(this.props.cell.column.toTable, this.props.langtag);
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
