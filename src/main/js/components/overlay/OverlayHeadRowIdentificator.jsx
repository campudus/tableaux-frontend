import React, {Component} from "react";
import i18n from "i18next";
import RowConcatHelper from "../../helpers/RowConcatHelper";

export default class OverlayHeadRowIdentificator extends Component {

  static propTypes = {
    cell: React.PropTypes.object,
    langtag: React.PropTypes.string
  };

  constructor(props) {
    super(props);
    this.rowIdentifierString = "";
  }

  componentWillMount = () => {
    const {cell, cell: {tableId}} = this.props;
    const table = cell.tables.get(tableId);
    const tableColumns = table.columns;
    const tableRows = table.rows;
    const currentRow = tableRows.get(cell.rowId);
    const idColumn = tableColumns.at(0);
    const idCellValue = currentRow.values[0];
    this.rowIdentifierString = RowConcatHelper.getCellAsStringWithFallback(idCellValue, idColumn, this.props.langtag);
  };

  render() {
    const {cell, langtag} = this.props;
    if (!cell) {
      return null;
    }

    const rowIdentification = (this.rowIdentifierString === "" || this.rowIdentifierString === RowConcatHelper.NOVALUE)
      ? <span className="row-identification-value empty-item">({i18n.t("common:empty")})</span>
      : <span className="row-identification-value">{this.rowIdentifierString}</span>;

    const {column} = cell;
    const columnDisplayName = column.displayName[langtag] || column.name;

    if (this.props.cell.isLink) {
      // TODO link to table?
      return (
        <span>
          <span className="column-name">
            {columnDisplayName}:{" "}
          </span>
          {rowIdentification}
        </span>
      );
    } else {
      return (
        <span>
          <span className="column-name">
            {columnDisplayName}:{" "}
          </span>
          {rowIdentification}
        </span>
      );
    }
  }
}
