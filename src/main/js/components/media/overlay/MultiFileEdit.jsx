import React, {Component, PropTypes} from "react";
import Dispatcher from "../../../dispatcher/Dispatcher";
import ActionCreator from "../../../actions/ActionCreator";
import {reduceMediaValuesToAllowedLanguages} from "../../../helpers/accessManagementHelper";
import {translate} from "react-i18next";
import TableauxConstants, {Langtags} from "../../../constants/TableauxConstants";
import connectToAmpersand from "../../helperComponents/connectToAmpersand";
import f from "lodash/fp";
import {merge} from "lodash";

@connectToAmpersand
class MultiFileEdit extends Component {

  static propTypes = {
    file: PropTypes.object.isRequired,
    langtag: PropTypes.string.isRequired,
    onClose: PropTypes.func.isRequired,
    editedTitleValue: PropTypes.object.isRequired,
    editedDescValue: PropTypes.object.isRequired,
    editedExternalnameValue: PropTypes.object.isRequired,
    editedLanguage: PropTypes.object.isRequired,
    onTitleChange: PropTypes.func.isRequired,
    onDescriptionChange: PropTypes.func.isRequired,
    onExternalnameChange: PropTypes.func.isRequired,
    hasChanged: PropTypes.bool.isRequired
  };

  componentWillMount() {
    Dispatcher.on("on-media-overlay-save", this.onSave);
    Dispatcher.on("on-media-overlay-cancel", this.onClose);
  }

  componentWillUnmount() {
    Dispatcher.off("on-media-overlay-save", this.onSave);
    Dispatcher.off("on-media-overlay-cancel", this.onClose);
  }

  onSave = () => {
    const {t, editedLanguage, hasChanged} = this.props;
    if (hasChanged) {
      const langDuplicates = f.compose(
        f.pickBy(f.lt(1)),                       // Select keys with 1 < N for any
        f.mapValues(f.size),                     //    cardinality of
        f.groupBy(f.identity),                   //    occurences within
        f.map((lt) => editedLanguage[lt] || lt)  //    langtags or edited languages
      )(Langtags);

      if (!f.isEmpty(langDuplicates)) {
        const multiLanguageError = t("error_multifile_multiple_languages", {langtags: f.join(", ", f.keys(langDuplicates))});
        alert(multiLanguageError);
        return;
      } else {
        var file = this.props.file;
        merge(file.title, this.props.editedTitleValue);
        merge(file.description, this.props.editedDescValue);
        merge(file.externalName, this.props.editedExternalnameValue);

        var changedFile = {
          title: {},
          description: {},
          externalName: {},
          internalName: {},
          mimeType: {}
        };
        for (var langToSwap in editedLanguage) {
          if (this.props.editedLanguage.hasOwnProperty(langToSwap)) {
            const langToSwapTo = this.props.editedLanguage[langToSwap];
            changedFile.title[langToSwapTo] = file.title[langToSwap] || null;
            changedFile.description[langToSwapTo] = file.description[langToSwap] || null;
            changedFile.externalName[langToSwapTo] = file.externalName[langToSwap] || null;
            changedFile.internalName[langToSwapTo] = file.internalName[langToSwap] || null;
            changedFile.mimeType[langToSwapTo] = file.mimeType[langToSwap] || null;
          }
        }

        merge(file.title, changedFile.title);
        merge(file.description, changedFile.description);
        merge(file.externalName, changedFile.externalName);
        merge(file.internalName, changedFile.internalName);
        merge(file.mimeType, changedFile.mimeType);

        const changeFileParams = reduceMediaValuesToAllowedLanguages([
          file.uuid,
          file.title,
          file.description,
          file.externalName,
          file.internalName,
          file.mimeType,
          file.folder,
          file.fileUrl
        ]);
        ActionCreator.changeFile(...changeFileParams);
      }
    }
    this.props.onClose(event);
  };

  onClose = () => {
    const {t} = this.props;
    if (this.props.hasChanged) {
      if (confirm(t("file_close_without_saving"))) {
        this.props.onClose();
      }
    } else {
      this.props.onClose();
    }
  };

  onTitleChange = (newValue, langtag) => {
    this.props.onTitleChange(newValue, langtag);
  };

  onDescriptionChange = (newValue, langtag) => {
    this.props.onDescriptionChange(newValue, langtag);
  };

  onExternalnameChange = (newValue, langtag) => {
    this.props.onExternalnameChange(newValue, langtag);
  };

  onLangChange = (newValue, langtag) => {
    this.props.onLangChange(newValue, langtag);
  };

  render() {
    const files = TableauxConstants.Langtags.map(function (langtag) {
      const {file, editedTitleValue, editedDescValue, editedExternalnameValue, editedLanguage} = self.props;
      const {title, internalName, externalName, description, uuid, fileUrl} = file;

      const fileData = {
        title: editedTitleValue[langtag] ? editedTitleValue[langtag] : title[langtag],
        description: editedDescValue[langtag] ? editedDescValue[langtag] : description[langtag],
        externalName: editedExternalnameValue[langtag] ? editedExternalnameValue[langtag] : externalName[langtag],
        internalName: internalName[langtag],
        fileUrl: fileUrl[langtag],
        uuid
      };
      const language = editedLanguage[langtag] ? editedLanguage[langtag] : langtag;
      return (
        <MultifileFileEdit key={langtag}
                           originalLangtag={langtag}
                           langtag={language}
                           fileData={fileData}
                           onTitleChange={self.onTitleChange}
                           onDescriptionChange={self.onDescriptionChange}
                           onExternalnameChange={self.onExternalnameChange}
                           onLangChange={self.onLangChange} />
      );
    });

    return (
      <div className="multifile-file-edit-wrapper content-items">
        {files}
      </div>
    );
  }
}

module.exports = translate(["media"])(MultiFileEdit);
