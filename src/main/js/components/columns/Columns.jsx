import React from "react";
import AmpersandMixin from "ampersand-react-mixin";
import {translate} from "react-i18next";
import {getLanguageOfLangtag} from "../../helpers/multiLanguage";
import TableauxConstants, {ColumnKinds, FallbackLanguage, LanguageType} from "../../constants/TableauxConstants";
import ColumnEntry from "./ColumnEntry.jsx";
import Dispatcher from "../../dispatcher/Dispatcher";
import * as _ from "lodash/fp";

const ActionTypes = TableauxConstants.ActionTypes;

//TODO: Refactor function passing, then adapt ColumnEntry and EditColumnEntry

const Columns = React.createClass({
  mixins: [AmpersandMixin],

  componentWillMount() {
    Dispatcher.on(ActionTypes.DONE_EDIT_HEADER, this.stopEditing, this);
  },

  componentWillUnmount() {
    Dispatcher.off(ActionTypes.DONE_EDIT_HEADER, this.stopEditing, this);
  },

  propTypes: {
    langtag: React.PropTypes.string.isRequired,
    columns: React.PropTypes.object.isRequired,
    table: React.PropTypes.object.isRequired,
    t: React.PropTypes.func.isRequired,
  },

  shouldComponentUpdate(nextProps, nextState) {
    const {langtag, columns} = this.props;
    return (
      !_.eq(this.state, nextState) ||
      langtag !== nextProps.langtag ||
      columns !== nextProps.columns
    );
  },

  getInitialState() {
    return {selected: null};
  },

  renderColumn(langtag, column, index) {
    let name, columnContent = [];
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

    //This is the ID/Concat Column
    if (column.id === 0) {
      name = t('concat_column_name');
    } else if (table.type === 'settings' && column.id === 1) {
      name = t('concat_column_name');
    } else {
      name = typeof columnDisplayName === "undefined" ? fallbackColumnDisplayName : columnDisplayName;
    }

    if (column.kind === ColumnKinds.link) {
      name =
        <a className="column-table-link" target="_blank" href={`/${langtag}/table/${column.toTable}`}>
          <i className="fa fa-columns" />
          {name}
          </a>;
    }

    columnContent.push(<span key="column-name" title={description}>{name}</span>);

    if (column.languageType && column.languageType === LanguageType.country) {
      columnIcon = <span className="column-kind-icon"><i className="fa fa-globe" /><span
        className="label">{t('country')}</span></span>;
    }

    return (
      <ColumnEntry key={index}
                   columnContent={columnContent}
                   columnIcon={columnIcon}
                   index={column.id}
                   selected={this.state.selected}
                   name={name}
                   column={column}
                   description={description}
                   langtag={langtag} />
    )
  },

  stopEditing(payload) {
    if (payload &&
      (payload.newName || payload.newDescription)) {
      this.saveEdits(payload);
    }
    this.forceUpdate();
  },

  saveEdits(payload) {
    const {langtag, colId, newName, newDescription} = payload;
    const {columns} = this.props;
    const modifications =
      _.compose(
        m => (newName) ?
          _.assign({"displayName": {[langtag]: newName}}, m) :
          m,
        m => (newDescription) ?
          _.assign({"description": {[langtag]: newDescription}}, m) :
          m
      )({});
    columns
      .filter(c => c.id === colId)
      .map(c => c.save(modifications, {patch: true}));
  },

  clickHandler(id) {
    if (id === 0) {
      return;
    } // don't edit "ID" header
    this.setState({selected: id});
  },

  deselect(id) {
    const {selected} = this.state;
    if (id === selected) {
      this.setState({
        selected: null,
        wait: true
      });
    }
  },

  render() {
    const self = this;

    return (

      <div id="tableHeader" ref="tableHeader" className="heading">
        <div className="tableHeader-inner">
          <div className="column-head meta-cell" key="-1">ID</div>
          {
            this.props.columns.map((column, index) => {
              return self.renderColumn(self.props.langtag, column, index);
            })
          }
        </div>
      </div>
    );
  }
});

module.exports = translate(['table'])(Columns);
