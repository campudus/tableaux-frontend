var React = require('react');
var App = require('ampersand-app');
var multiLanguage = require('../../helpers/multiLanguage');

var FileEditHead = React.createClass({
  displayName : 'FileEditHead',

  propTypes : {
    file : React.PropTypes.object.isRequired,
    langtag : React.PropTypes.string.isRequired
  },

  render : function () {
    // default language (for fallback)
    var fallbackLang = App.langtags[0];
    if (this.props.file.title.zxx_ZXX) {
      fallbackLang = "zxx_ZXX";
    }
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
