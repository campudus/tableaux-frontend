var React = require('react');
var App = require('ampersand-app');
var multiLanguage = require('../../../helpers/multiLanguage');

var FileEditHead = React.createClass({
  propTypes : {
    file : React.PropTypes.object.isRequired,
    langtag : React.PropTypes.string.isRequired
  },

  render : function () {
    // default language (for fallback)
    var fallbackLang = App.langtags[0];
    var retrieveTranslation = multiLanguage.retrieveTranslation(fallbackLang);

    // current language
    var langtag = this.props.langtag;
    var title = retrieveTranslation(this.props.file.title, langtag);

    return (
      <span>{title}</span>
    );
  }
});

module.exports = FileEditHead;
