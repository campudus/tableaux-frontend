import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import { ColumnKinds, DefaultLangtag } from "../../constants/TableauxConstants";
import ColumnEntry from "./ColumnEntry";
import f from "lodash/fp";
import { getColumnDisplayName } from "../../helpers/multiLanguage"

export default class ColumnHeader extends PureComponent {
  static propTypes = {
    column: PropTypes.object.isRequired,
    langtag: PropTypes.string.isRequired,
    tables: PropTypes.object.isRequired,
    tableId: PropTypes.number.isRequired,
    resizeHandler: PropTypes.func.isRequired,
    resizeFinishedHandler: PropTypes.func.isRequired
  };

  getDisplayName = () => {
    const {
      column: { name, displayName },
      langtag
    } = this.props;
    // const table = tables.get(tableId);
    return displayName[langtag] || displayName[DefaultLangtag] || name;
  };

  getIdentifierIcon = () => {
    const { column = {} } = this.props;
    const key = `${column.id}-id-icon`;
    if (column.kind === ColumnKinds.concat) {
      return <i key={key} className="fa fa-bookmark" />;
    } else if (column.identifier) {
      return <i key={key} className="fa fa-bookmark-o" />;
    }
    return null;
  };

  mkLinkHeader = toTable => {
    const { langtag, column } = this.props;
    const key = `${column.id}-display-name`;
    return toTable.hidden ? (
      <div key={key}>{getColumnDisplayName(column, langtag)}</div>
    ) : (
      <a
        key={key}
        className="tableHeader-inner"
        href={`/${langtag}/tables/${column.toTable}`}
        target="_blank"
        rel="noopener"
      >
        <i className="fa fa-columns" />
        {getColumnDisplayName(column, langtag)}
      </a>
    );
  };

  getDescription = () => {
    const {
      column: { description },
      langtag
    } = this.props;
    return description[langtag] || description[DefaultLangtag];
  };

  render() {
    const {
      column,
      resizeHandler,
      resizeFinishedHandler,
      index,
      langtag,
      style,
      tables,
      width,
      actions,
      navigate,
      tableId
    } = this.props;
    const toTable = column.kind === "link"
      ? f.find(table => table.id === column.toTable, tables)
      : {};

    const columnContent = [
      this.getIdentifierIcon(),
      column.kind === ColumnKinds.link
        ? this.mkLinkHeader(toTable)
        : getColumnDisplayName(column,langtag)
    ];

    return (
      <ColumnEntry
        style={style}
        columnContent={columnContent}
        name={getColumnDisplayName(column,langtag)}
        column={column}
        description={this.getDescription()}
        langtag={langtag}
        isId={column.identifier}
        tables={tables}
        resizeHandler={resizeHandler}
        resizeFinishedHandler={resizeFinishedHandler}
        index={index}
        width={width}
        actions={actions}
        navigate={navigate}
        tableId={tableId}
        toTable={toTable}
      />
    );
  }
}
