var React = require('react');

var LabelLinkCell = React.createClass({

  renderSingleLanguage : function (value) {
    return <span className="link" onClick={this.props.click}>{value}</span>;
  },

  renderMultiLanguage : function (language, values) {
    var value = values[language] || null;

    return <span className="link" onClick={this.props.click}>{value}</span>;
  },

  render : function () {
    if (this.props.cell.column.toColumn.multilanguage) {
      return this.renderMultiLanguage(this.props.language, this.props.element.value);
    } else {
      return this.renderSingleLanguage(this.props.element.value)
    }
  }

});

module.exports = LabelLinkCell;
