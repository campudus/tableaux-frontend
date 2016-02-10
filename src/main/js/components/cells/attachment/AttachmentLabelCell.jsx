var React = require('react');
var App = require('ampersand-app');
var multiLanguage = require('../../../helpers/multiLanguage');

var AttachmentLabelCell = React.createClass({

  propTypes : {
    cell : React.PropTypes.object.isRequired,
    attachmentElement : React.PropTypes.object.isRequired,
    langtag : React.PropTypes.string.isRequired,

    //optional for delete label
    deletable : React.PropTypes.bool.isRequired,
    onDelete : React.PropTypes.func
  },

  removeAttachmentHandler : function (event) {
    event.preventDefault();
    event.stopPropagation();
    this.props.onDelete(this.props.id);
  },

  render : function () {
    var fallbackLang = App.defaultLangtag;
    var retrieveTranslation = multiLanguage.retrieveTranslation(fallbackLang);
    var attachmentTitle = retrieveTranslation(this.props.attachmentElement.title, this.props.langtag);

    var theClassName = "link-label";
    var hasDeleteButton = this.props.deletable;
    var deleteButton = <i onClick={this.removeAttachmentHandler} className="fa fa-times"></i>;

    if (hasDeleteButton) {
      theClassName += " delete";
    }

    return (
      <span className={theClassName}>{attachmentTitle}{hasDeleteButton ? deleteButton : ""}</span>
    );

  }

});

module.exports = AttachmentLabelCell;
