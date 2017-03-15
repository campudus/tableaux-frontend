var React = require("react");
var App = require("ampersand-app");
var MultifileFileEdit = require("./MultifileFileEdit.jsx");
var ampersandMixin = require("ampersand-react-mixin");
var Dispatcher = require("../../../dispatcher/Dispatcher");
var ActionCreator = require("../../../actions/ActionCreator");
import {reduceMediaValuesToAllowedLanguages} from "../../../helpers/accessManagementHelper";
var _ = require("lodash");
import {translate} from "react-i18next";
import TableauxConstants from "../../../constants/TableauxConstants";

var MultiFileEdit = React.createClass({

  mixins: [ampersandMixin],

  propTypes: {
    file: React.PropTypes.object.isRequired,
    langtag: React.PropTypes.string.isRequired,
    onClose: React.PropTypes.func.isRequired,
    editedTitleValue: React.PropTypes.object.isRequired,
    editedDescValue: React.PropTypes.object.isRequired,
    editedExternalnameValue: React.PropTypes.object.isRequired,
    editedLanguage: React.PropTypes.object.isRequired,
    onTitleChange: React.PropTypes.func.isRequired,
    onDescriptionChange: React.PropTypes.func.isRequired,
    onExternalnameChange: React.PropTypes.func.isRequired,
    hasChanged: React.PropTypes.bool.isRequired
  },

  componentWillMount: function () {
    Dispatcher.on("on-media-overlay-save", this.onSave);
    Dispatcher.on("on-media-overlay-cancel", this.onClose);
  },

  componentWillUnmount: function () {
    Dispatcher.off("on-media-overlay-save", this.onSave);
    Dispatcher.off("on-media-overlay-cancel", this.onClose);
  },

  onSave: function () {
    var self = this;
    const {t} = this.props;
    if (this.props.hasChanged) {
      var foundLangs = [];
      var langDuplicates = [];
      TableauxConstants.Langtags.forEach(function (langtag) {
        var lang = self.props.editedLanguage[langtag] ? self.props.editedLanguage[langtag] : langtag;
        if (_.includes(foundLangs, lang)) {
          langDuplicates.push(lang);
        } else {
          foundLangs.push(lang);
        }
      });

      if (langDuplicates.length > 0) {
        const multiLanguageError = t("error_multifile_multiple_languages", {langtags: langDuplicates.join(",")});
        alert(multiLanguageError);
        return;
      } else {
        var file = this.props.file;
        _.merge(file.title, this.props.editedTitleValue);
        _.merge(file.description, this.props.editedDescValue);
        _.merge(file.externalName, this.props.editedExternalnameValue);

        var changedFile = {
          title: {},
          description: {},
          externalName: {},
          internalName: {},
          mimeType: {}
        };
        for (var langToSwap in this.props.editedLanguage) {
          if (this.props.editedLanguage.hasOwnProperty(langToSwap)) {
            var langToSwapTo = this.props.editedLanguage[langToSwap];
            changedFile.title[langToSwapTo] = file.title[langToSwap] || null;
            changedFile.description[langToSwapTo] = file.description[langToSwap] || null;
            changedFile.externalName[langToSwapTo] = file.externalName[langToSwap] || null;
            changedFile.internalName[langToSwapTo] = file.internalName[langToSwap] || null;
            changedFile.mimeType[langToSwapTo] = file.mimeType[langToSwap] || null;
          }
        }

        _.merge(file.title, changedFile.title);
        _.merge(file.description, changedFile.description);
        _.merge(file.externalName, changedFile.externalName);
        _.merge(file.internalName, changedFile.internalName);
        _.merge(file.mimeType, changedFile.mimeType);

        const changeFileParams = reduceMediaValuesToAllowedLanguages([file.uuid, file.title, file.description, file.externalName, file.internalName, file.mimeType, file.folder, file.fileUrl]);
        ActionCreator.changeFile(...changeFileParams);
      }
    }
    this.props.onClose(event);
  },

  onClose: function () {
    const {t} = this.props;
    if (this.props.hasChanged) {
      if (confirm(t("file_close_without_saving"))) {
        this.props.onClose();
      }
    } else {
      this.props.onClose();
    }
  },

  onTitleChange: function (newValue, langtag) {
    this.props.onTitleChange(newValue, langtag);
  },

  onDescriptionChange: function (newValue, langtag) {
    this.props.onDescriptionChange(newValue, langtag);
  },

  onExternalnameChange: function (newValue, langtag) {
    this.props.onExternalnameChange(newValue, langtag);
  },

  onLangChange: function (newValue, langtag) {
    this.props.onLangChange(newValue, langtag);
  },

  render: function () {
    var self = this;
    var files = TableauxConstants.Langtags.map(function (langtag) {
      const {file, editedTitleValue, editedDescValue, editedExternalnameValue, editedLanguage} = self.props;
      const {title, internalName, externalName, description, uuid, fileUrl} = file;

      var fileData = {
        title: editedTitleValue[langtag] ? editedTitleValue[langtag] : title[langtag],
        description: editedDescValue[langtag] ? editedDescValue[langtag] : description[langtag],
        externalName: editedExternalnameValue[langtag] ? editedExternalnameValue[langtag] : externalName[langtag],
        internalName: internalName[langtag],
        fileUrl: fileUrl[langtag],
        uuid
      };
      var language = editedLanguage[langtag] ? editedLanguage[langtag] : langtag;
      return (
        <MultifileFileEdit key={langtag}
                           originalLangtag={langtag}
                           langtag={language}
                           fileData={fileData}
                           onTitleChange={self.onTitleChange}
                           onDescriptionChange={self.onDescriptionChange}
                           onExternalnameChange={self.onExternalnameChange}
                           onLangChange={self.onLangChange}/>
      );
    });

    return (
      <div className="multifile-file-edit-wrapper">
        {files}
      </div>
    );
  }
});

module.exports = translate(["media"])(MultiFileEdit);
