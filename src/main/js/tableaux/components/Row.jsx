var React = require('react');
var AmpersandMixin = require('ampersand-react-mixin');
var Cell = require('./cell/Cell.jsx');
var _ = require('lodash');

var Row = React.createClass({
  mixins : [AmpersandMixin],

  getInitialState : function () {
    return {
      expanded : false,
      hover : false
    }
  },

  toggleExpand : function () {
    this.setState({
      expanded : !this.state.expanded
    });
  },

  onRemove : function () {
    this.props.row.destroy();
  },

  toggleDeleteButton : function () {
    this.setState({hover : !this.state.hover});
  },

  renderLanguageRow : function (currentLanguageTag, languageTag) {
    var className = 'row row-' + this.props.row.getId();

    var language = languageTag.split("_")[0];
    var country = languageTag.split("_")[1];

    var icon = country.toLowerCase() + ".png";

    var displayNone = {display : "none"};
    var display = {display : "inline"};

    return (
      <div onMouseEnter={this.toggleDeleteButton} onMouseLeave={this.toggleDeleteButton} key={languageTag}
           className={className}>
        <div className="delete-row" style={ this.state.hover ? display : displayNone }>
          <button className="button" onClick={this.onRemove}><i className="fa fa-trash"></i></button>
        </div>
        <div className={'cell cell-0-' + this.props.row.getId() + ' language'} onClick={this.toggleExpand}>
          <span><img src={"/img/flags/" + icon} alt={country}/> {language.toUpperCase()}</span>
        </div>
        {this.props.row.cells.map(function (cell, idx) {
          if (!cell.isMultiLanguage && currentLanguageTag !== languageTag) {
            var className = 'cell cell-' + cell.column.getId() + '-' + cell.rowId + ' repeat';
            return <div key={idx} className={className}>—.—</div>
          } else {
            return <Cell key={idx} cell={cell} language={languageTag}/>;
          }
        })}
      </div>
    );
  },

  render : function () {
    var self = this;

    var languageTags = [
      "de_DE",
      "en_GB",
      "en_US",
      "fr_FR"
    ];
    var currentLanguageTag = languageTags[0];

    if (this.state.expanded) {
      return (
        <div>
          {languageTags.map(function (languageTag) {
            return self.renderLanguageRow(currentLanguageTag, languageTag);
          })}
        </div>
      );
    } else {
      return this.renderLanguageRow(currentLanguageTag, currentLanguageTag);
    }
  }
});

module.exports = Row;
