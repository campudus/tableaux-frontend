import React, { PureComponent } from "react";
import f from "lodash/fp";

import PropTypes from "prop-types";

import { ColumnKinds } from "../../constants/TableauxConstants";
import { canUserSeeTable } from "../../helpers/accessManagementHelper";
import {
  getColumnDisplayName,
  retrieveTranslation
} from "../../helpers/multiLanguage";
import ColumnEntry from "./ColumnEntry";

export default class ColumnHeader extends PureComponent {
  static propTypes = {
    column: PropTypes.object.isRequired,
    langtag: PropTypes.string.isRequired,
    tables: PropTypes.object.isRequired,
    tableId: PropTypes.number.isRequired,
    resizeHandler: PropTypes.func.isRequired,
    resizeFinishedHandler: PropTypes.func.isRequired
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
    const displayName = getColumnDisplayName(column, langtag);
    return !canUserSeeTable(toTable) ? (
      <div key={key}>{displayName}</div>
    ) : (
      <a
        key={key}
        className="tableHeader-inner"
        href={`/${langtag}/tables/${column.toTable}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        <i className="fa fa-columns" />
        {displayName}
      </a>
    );
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
    const toTable =
      column.kind === "link"
        ? f.find(table => table.id === column.toTable, tables)
        : {};

    const displayName = getColumnDisplayName(column, langtag);

    const columnContent = [
      this.getIdentifierIcon(),
      column.kind === ColumnKinds.link
        ? this.mkLinkHeader(toTable)
        : displayName
    ];

    return (
      <ColumnEntry
        style={style}
        columnContent={columnContent}
        name={displayName}
        column={column}
        description={retrieveTranslation(langtag, column.description || {})}
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
