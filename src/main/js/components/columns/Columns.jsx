import React from 'react';
import AmpersandMixin from 'ampersand-react-mixin';
import {translate} from 'react-i18next';
import {getLanguageOfLangtag} from '../../helpers/multiLanguage';
import {ColumnKinds, FallbackLanguage, LanguageType} from '../../constants/TableauxConstants';

var Columns = React.createClass({
  mixins : [AmpersandMixin],

  propTypes : {
    langtag : React.PropTypes.string.isRequired,
    columns : React.PropTypes.object.isRequired,
    table : React.PropTypes.object.isRequired,
    t : React.PropTypes.func.isRequired,
  },

  shouldComponentUpdate(nextProps, nextState) {
    const {langtag, columns} = this.props;
    return (langtag !== nextProps.langtag || columns !== nextProps.columns)
  },

  renderColumn(langtag, column, index) {
    let name, columnContent = [];
    const {t, table} = this.props;
    const description = column.description[langtag];

    const language = getLanguageOfLangtag(langtag);
    const columnDisplayName = column.displayName[language];
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

    return <div className="column-head" key={index}>{columnContent}{columnIcon}</div>
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
