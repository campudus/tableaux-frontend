var React = require('react');
var AmpersandMixin = require('ampersand-react-mixin');
import {translate} from 'react-i18next';

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
    var columnContent = [];
    let {t} = this.props;
    if (column.kind === "concat") {
      columnContent.push(<i key="column-icon" className="fa fa-bookmark"/>);
    } else if (column.identifier) {
      columnContent.push(<i key="column-icon" className="fa fa-bookmark-o"/>);
    }

    const description = column.description[langtag];
    let name;
    //This is the ID/Concat Column
    if (column.id === 0) {
      name = t('concat_column_name');
    } else {
      name = typeof column.displayName[langtag] === "undefined" ? column.name : column.displayName[langtag];
    }

    columnContent.push(<span key="column-name" title={description}>{name}</span>);

    return <div className="column-head" key={index}>{columnContent}</div>
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
