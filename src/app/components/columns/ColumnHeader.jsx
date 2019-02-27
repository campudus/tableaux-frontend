import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import {
  ColumnKinds,
  DefaultLangtag
} from "../../constants/TableauxConstants";
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

  mkLinkHeader = () => {
    const { langtag, column } = this.props;
    const key = `${column.id}-display-name`;
    return false ? ( //(this.isToTableHidden())
      <div key={key}>{this.getDisplayName()}</div>
    ) : (
      <a
        key={key}
        className="tableHeader-inner"
        href={`/${langtag}/tables/${column.toTable}`}
        target="_blank"
        rel="noopener"
      >
        <i className="fa fa-columns" />
        {this.getDisplayName()}
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

    const columnContent = [
      this.getIdentifierIcon(),
      column.kind === ColumnKinds.link
        ? this.mkLinkHeader()
        : this.getDisplayName()
    ];

    return (
      <ColumnEntry
        style={style}
        columnContent={columnContent}
        name={this.getDisplayName()}
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
      />
    );
  }
}
