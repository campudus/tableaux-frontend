var React = require('react');

var LabelCell = React.createClass({

  renderSingleLanguage : function () {
    var cell = this.props.cell;
    return (
      <div className={'cell cell-' + cell.column.getId() + '-' + cell.rowId} onClick={this.props.onClick}>
        {cell.value}
      </div>
    );
  },

  renderMultiLanguage : function () {
    var cell = this.props.cell;
    var language = this.props.language;
    var value = cell.value[language];

    return (
      <div className={'cell cell-' + cell.column.getId() + '-' + cell.rowId} onClick={this.props.onClick}>
        {value}
      </div>
    );
  },

  render : function () {
    var cell = this.props.cell;

    if (cell.isMultiLanguage) {
      return this.renderMultiLanguage();
    } else {
      return this.renderSingleLanguage();
    }
  }
});

module.exports = LabelCell;
