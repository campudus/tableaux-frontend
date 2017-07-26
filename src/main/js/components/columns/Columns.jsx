import React from "react";
import {translate} from "react-i18next";
import {getLanguageOfLangtag} from "../../helpers/multiLanguage";
import {ActionTypes, ColumnKinds, FallbackLanguage, LanguageType} from "../../constants/TableauxConstants";
import ColumnEntry from "./ColumnEntry.jsx";
import Dispatcher from "../../dispatcher/Dispatcher";
import * as f from "lodash/fp";
import connectToAmpersand from "../helperComponents/connectToAmpersand";
import {maybe} from "../../helpers/monads";

@translate(["table"])
@connectToAmpersand
class Columns extends React.Component {

  constructor(props) {
    super(props);
    this.props.columns.forEach((column) => {
      this.props.watch(column,
        {
          event: "change",
          force: true
        });
    });
  };

  componentWillMount = () => {
    Dispatcher.on(ActionTypes.DONE_EDIT_HEADER, this.stopEditing, this);
  };

  componentWillUnmount = () => {
    Dispatcher.off(ActionTypes.DONE_EDIT_HEADER, this.stopEditing, this);
  };

  shouldComponentUpdate = (nextProps, nextState) => {
    const {langtag} = this.props;
    const shouldUpdate =
      !f.isEqual(this.state, nextState)
      || langtag !== nextProps.langtag;

    return shouldUpdate;
  };

  renderColumn = (langtag, column, index) => {
    // Skip header of hidden columns
    if (column !== f.first(this.props.columns.models) && !column.visible) {
      return;
    }

    let name = [];
    let columnContent = [];
    const {t, table} = this.props;
    const description = column.description[langtag];

    const language = getLanguageOfLangtag(langtag);
    const columnDisplayName = column.displayName[langtag] || column.displayName[language];
    const fallbackColumnDisplayName = column.displayName[FallbackLanguage] || column.name;
    let columnIcon = null;

    if (column.kind === ColumnKinds.concat) {
      columnContent.push(<i key="column-icon" className="fa fa-bookmark" />);
    } else if (column.identifier) {
      columnContent.push(<i key="column-icon" className="fa fa-bookmark-o" />);
    }

    // This is the ID/Concat Column
    if (column.id === 0) {
      name = t("concat_column_name");
    } else if (table.type === "settings" && column.id === 1) {
      name = t("concat_column_name");
    } else {
      name = typeof columnDisplayName === "undefined" ? fallbackColumnDisplayName : columnDisplayName;
    }

    const toTableHidden = maybe(table)
      .map(f.get("rows"))            // catch rows not loaded yet
      .exec("at", 0)
      .map(f.get("cells"))           // catch cells not loaded yet
      .exec("at", 0)
      .map(f.get("tables"))
      .exec("get", column.toTable)   // only with link columns
      .map(f.get("hidden"))
      .getOrElse("false");

    if (column.kind === ColumnKinds.link && !toTableHidden) {
      name =
        <a className="column-table-link" target="_blank" rel="noopener" href={`/${langtag}/tables/${column.toTable}`}>
          <i className="fa fa-columns" />
          {name}
        </a>;
    }

    columnContent.push(
      <span key="column-name">
        {name}
        {(f.isEmpty(description)) ? null : <i className="description-hint fa fa-info-circle" /> }
      </span>
    );

    if (column.languageType && column.languageType === LanguageType.country) {
      columnIcon = <span className="column-kind-icon"><i className="fa fa-globe" /><span
        className="label">{t("country")}</span></span>;
    }

    return (
      <ColumnEntry key={index}
                   columnContent={columnContent}
                   columnIcon={columnIcon}
                   name={name}
                   column={column}
                   description={description}
                   langtag={langtag}
                   isId={column === f.first(this.props.columns.models)}
                   tables={this.props.tables}
      />
    );
  };

  stopEditing = (payload) => {
    if (payload
      && (payload.newName || payload.newDescription)) {
      this.saveEdits(payload);
    }
  };

  saveEdits = (payload) => {
    const {langtag, colId, newName, newDescription} = payload;
    const {columns} = this.props;
    const modifications =
      f.compose(
        m => (newName)
          ? f.assign({"displayName": {[langtag]: newName}}, m)
          : m,
        m => (newDescription)
          ? f.assign({"description": {[langtag]: newDescription}}, m)
          : m
      )({});

    columns
      .get(colId)
      .save(modifications, {
        patch: true,
        wait: true,
        success: () => this.forceUpdate()
      });
  };

  render = () => {
    return (
      <div id="tableHeader" ref="tableHeader" className="heading">
        <div className="tableHeader-inner">
          <div className="column-head meta-cell" key="-1">ID</div>
          {
            this.props.columns.map((column, index) => {
              return this.renderColumn(this.props.langtag, column, index);
            })
          }
        </div>
      </div>
    );
  }
}

Columns.propTypes = {
  langtag: React.PropTypes.string.isRequired,
  columns: React.PropTypes.object.isRequired,
  table: React.PropTypes.object.isRequired,
  tables: React.PropTypes.object.isRequired,
  t: React.PropTypes.func
};

export default Columns;
