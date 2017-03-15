var React = require("react");
var RowConcatHelper = require("../../helpers/RowConcatHelper");
var ActionCreator = require("../../actions/ActionCreator");

var OverlayHeadRowIdentificator = React.createClass({

  propTypes: {
    cell: React.PropTypes.object,
    langtag: React.PropTypes.string
  },

  rowIdentifierString: "",

  componentWillMount: function () {
    var cell = this.props.cell;
    var tableId = cell.tableId;
    var table = cell.tables.get(tableId);
    var tableColumns = table.columns;
    var tableRows = table.rows;
    var currentRow = tableRows.get(cell.rowId);
    var idColumn = tableColumns.at(0);
    var idCellValue = currentRow.values[0];
    this.rowIdentifierString = RowConcatHelper.getCellAsStringWithFallback(idCellValue, idColumn, this.props.langtag);
  },

  render: function () {
    var rowIdentification = null;
    if (this.rowIdentifierString !== "") {
      rowIdentification = <span className="row-identification-value">{this.rowIdentifierString}</span>;
    }

    if (this.props.cell != null) {
      const {column} = this.props.cell;
      const {langtag} = this.props;
      const columnDisplayName = typeof column.displayName[langtag] === "undefined" ? column.name : column.displayName[langtag];

      if (this.props.cell.isLink) {
        const {toTable} = this.props.cell.column;
        const linkToTable = `/${langtag}/tables/${toTable}`;
        return (
          <span>
            <a href={linkToTable} target="_blank" className="column-name with-link">
              <i className="fa fa-columns"></i>{columnDisplayName}</a>{rowIdentification}
          </span>
        );
      } else {
        return (
          <span>
            <span className="column-name">{columnDisplayName}: </span>{rowIdentification}
          </span>
        );
      }
    } else {
      return null;
    }
  }

});

module.exports = OverlayHeadRowIdentificator;
