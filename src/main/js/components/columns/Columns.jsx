var React = require('react');
var AmpersandMixin = require('ampersand-react-mixin');
import {translate} from 'react-i18next';
import {getLanguageOfLangtag} from '../../helpers/multiLanguage';
import TableauxConstants from '../../constants/TableauxConstants';
const {ColumnKinds} = TableauxConstants;

var Columns = React.createClass({
  mixins : [AmpersandMixin],

  propTypes : {
    langtag : React.PropTypes.string.isRequired,
    columns : React.PropTypes.object.isRequired
  },

  shouldComponentUpdate(nextProps, nextState) {
    const {langtag, columns} = this.props;
    return (langtag !== nextProps.langtag || columns !== nextProps.columns)
  },

  renderColumn(langtag, column, index) {
    let name, columnContent = [];
    const {t} = this.props;
    const description = column.description[langtag];
    const language = getLanguageOfLangtag(langtag);
    const columnDisplayName = column.displayName[language];
    const fallbackColumnDisplayName = column.displayName[TableauxConstants.FallbackLanguage] || column.name;
    let columnIcon = null;

    if (column.kind === ColumnKinds.concat) {
      columnContent.push(<i key="column-icon" className="fa fa-bookmark"/>);
    } else if (column.identifier) {
      columnContent.push(<i key="column-icon" className="fa fa-bookmark-o"/>);
    }

    //This is the ID/Concat Column
    if (column.id === 0) {
      name = t('concat_column_name');
    } else {
      name = typeof columnDisplayName === "undefined" ? fallbackColumnDisplayName : columnDisplayName;
    }

    columnContent.push(<span key="column-name" title={description}>{name}</span>);

    if (column.languageType && column.languageType === TableauxConstants.LanguageType.country) {
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
