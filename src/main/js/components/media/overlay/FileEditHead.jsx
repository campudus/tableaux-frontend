var React = require("react");
var multiLanguage = require("../../../helpers/multiLanguage");
import TableauxConstants from "../../../constants/TableauxConstants";

var FileEditHead = React.createClass({
  propTypes: {
    file: React.PropTypes.object.isRequired,
    langtag: React.PropTypes.string.isRequired
  },

  render: function () {
    // default language (for fallback)
    var fallbackLang = TableauxConstants.DefaultLangtag;
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
