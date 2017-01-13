import React from 'react';
import AmpersandMixin from 'ampersand-react-mixin';
import {translate} from 'react-i18next';
import {getLanguageOfLangtag} from '../../helpers/multiLanguage';
import {ColumnKinds, FallbackLanguage, LanguageType} from '../../constants/TableauxConstants';
import * as _ from 'lodash'
import ColumnEntry from './ColumnEntry.jsx'
import TableauxConstants from "../../constants/TableauxConstants"
import Dispatcher from "../../dispatcher/Dispatcher"
import * as ColHelper from '../../helpers/ColumnHelper'
import ActionCreator from '../../actions/ActionCreator'

const ActionTypes = TableauxConstants.ActionTypes

var Columns = React.createClass({
  mixins : [AmpersandMixin],

  componentWillMount() {
    Dispatcher.on(ActionTypes.DONE_EDIT_HEADER, this.stopEditing, this)
  },

  componentWillUnmount() {
    Dispatcher.off(ActionTypes.DONE_EDIT_HEADER, this.stopEditing, this)
  },

  propTypes : {
    langtag : React.PropTypes.string.isRequired,
    columns : React.PropTypes.object.isRequired,
    table : React.PropTypes.object.isRequired,
    t : React.PropTypes.func.isRequired,
  },

  shouldComponentUpdate(nextProps, nextState) {
    const {langtag, columns} = this.props;
    return (
        !_.eq(this.state, nextState) ||
        langtag !== nextProps.langtag ||
        columns !== nextProps.columns
    )
  },

  getInitialState() {
    return {
      selected: null,
      edit: null
    }
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
      columnContent.push(<i key="column-icon" className="fa fa-bookmark"/>);
    } else if (column.identifier) {
      columnContent.push(<i key="column-icon" className="fa fa-bookmark-o"/>);
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
          <a target="_blank" href={`/${langtag}/table/${column.toTable}`}>{name} <i className="fa fa-external-link"/></a>;
    }

    columnContent.push(<span key="column-name" title={description}>{name}</span>);

    if (column.languageType && column.languageType === LanguageType.country) {
      columnIcon = <span className="column-kind-icon"><i className="fa fa-globe"/><span
          className="label">{t('country')}</span></span>;
    }

    return (
        <ColumnEntry key={index}
                     clickHandler={() => this.clickHandler(index)}
                     onBlur={() => this.clickHandler(null)}
                     columnContent={columnContent}
                     columnIcon={columnIcon}
                     index={column.id}
                     selected={this.state.selected}
                     edit={this.state.edit}
                     name={name}
                     langtag={langtag} />
    )
  },

  stopEditing(payload) {
    if (payload.newName) {
      this.saveEdits(payload)
    }
    this.setState({ edit: null })
  },

  saveEdits(payload) {
    const {colId,langtag,newName} = payload
    const tableId = this.props.table._values.id
    ColHelper.changeDisplayName(langtag, tableId, colId, newName)
        .then(ActionCreator.refreshHeaders(tableId))
  },

  clickHandler(id) {
    //TODO: disable editing if not admin; short-circuiting click-handler will suffice
    if (id === 0) return // don't edit "ID" header

    const {selected} = this.state
    this.setState({
      selected: id,
      edit: (selected === id) ? id : null
    })
  },

  render() {
    var self = this;

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
