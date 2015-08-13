var React = require('react');
var OutsideClick = require('react-onclickoutside');

var EditLinkCell = React.createClass({

  mixins : [OutsideClick],

  removeLink : function () {
    console.log('remove link', this.props.element, 'in', this.props.cell);
    this.props.onRemove();
  },

  handleClickOutside : function (evt) {
    this.props.onBlur();
  },

  renderSingleLanguage : function (value) {
    return <span className="link" onClick={this.props.click}>{value}</span>;
  },

  renderMultiLanguage : function (language, values) {
    var value = values[language] || null;
    return <span className="link" onClick={this.props.click}>{value}</span>;
  },

  render : function () {

    var value = null;
    if (this.props.cell.column.toColumn.multilanguage) {
      value = this.renderMultiLanguage(this.props.language, this.props.element.value);
    } else {
      value = this.renderSingleLanguage(this.props.element.value)
    }

    return (
      <div className="link editing">
        {value}
        <button className="delete" onClick={this.removeLink}>x</button>
      </div>
    );
  }

});

module.exports = EditLinkCell;
