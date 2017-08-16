import React, {PropTypes, PureComponent} from "react";
import {ActionTypes, ColumnKinds, DefaultLangtag} from "../../constants/TableauxConstants";
import f from "lodash/fp";
import {maybe} from "../../helpers/functools";
import i18n from "i18next";
import ColumnEntry from "./ColumnEntry";
import Dispatcher from "../../dispatcher/Dispatcher";

export default class ColumnHeader extends PureComponent {
  static propTypes = {
    column: PropTypes.object.isRequired,
    langtag: PropTypes.string.isRequired,
    tables: PropTypes.object.isRequired,
    tableId: PropTypes.number.isRequired,
    dragHandler: PropTypes.func.isRequired
  };

  componentWillMount = () => {
    Dispatcher.on(ActionTypes.DONE_EDIT_HEADER, this.stopEditing, this);
  };

  componentWillUnmount = () => {
    Dispatcher.off(ActionTypes.DONE_EDIT_HEADER, this.stopEditing, this);
  };

  getDisplayName = () => {
    const {column, column: {name, displayName}, langtag, tableId, tables} = this.props;
    const table = tables.get(tableId);
    return (column.kind === ColumnKinds.concat || column.id === 0
      || table.type === "settings" && column.id === 1
    )
      ? i18n.t("table:concat_column_name")
      : displayName[langtag] || displayName[DefaultLangtag] || name;
  };

  isToTableHidden = () => {
    const {column, tableId, tables} = this.props;
    const table = tables.get(tableId);
    return maybe(table)
      .map(f.get("rows"))            // catch rows not loaded yet
      .exec("at", 0)
      .map(f.get("cells"))           // catch cells not loaded yet
      .exec("at", 0)
      .map(f.get("tables"))
      .exec("get", column.toTable)   // only with link columns
      .map(f.get("hidden"))
      .getOrElse("false");
  };

  getIdentifierIcon = () => {
    const {column} = this.props;
    const key = `${column.id}-id-icon`;
    if (column.kind === ColumnKinds.concat) {
      return <i key={key} className="fa fa-bookmark" />;
    } else if (column.identifier) {
      return <i key={key} className="fa fa-bookmark-o" />;
    }
    return null;
  };

  mkLinkHeader = () => {
    const {langtag, column} = this.props;
    const key = `${column.id}-display-name`;
    return (this.isToTableHidden())
      ? <div key={key}>{this.getDisplayName()}</div>
      : (
        <a key={key} className="tableHeader-inner"
           href={`/${langtag}/tables/${column.toTable}`}
           target="_blank"
           rel="noopener"
        >
          <i className="fa fa-columns" />
          {this.getDisplayName()}
        </a>
      );
  };

  stopEditing = (payload) => {
    if (payload
      && (payload.newName || payload.newDescription)) {
      this.saveEdits(payload);
    }
  };

  saveEdits = (payload) => {
    const {langtag, newName, newDescription} = payload;
    const {column} = this.props;
    const modifications =
      f.compose(
        m => (newName)
          ? f.assign({"displayName": {[langtag]: newName}}, m)
          : m,
        m => (newDescription)
          ? f.assign({"description": {[langtag]: newDescription}}, m)
          : m
      )({});

    column
      .save(modifications, {
        patch: true,
        wait: true,
        success: () => this.forceUpdate()
      });
  };

  getDescription = () => {
    const {column: {description}, langtag} = this.props;
    return description[langtag] || description[DefaultLangtag];
  };

  render() {
    const {column, dragHandler, index, langtag, style, tables, width} = this.props;

    const columnContent =
      [this.getIdentifierIcon(),
        (column.kind === ColumnKinds.link)
          ? this.mkLinkHeader()
          : this.getDisplayName()
      ];

    return (
      <ColumnEntry style={style}
                   columnContent={columnContent}
                   name={this.getDisplayName()}
                   column={column}
                   description={this.getDescription()}
                   langtag={langtag}
                   isId={column.identifier}
                   tables={tables}
                   dragHandler={dragHandler}
                   index={index}
                   width={width}
      />
    );
  }
}
