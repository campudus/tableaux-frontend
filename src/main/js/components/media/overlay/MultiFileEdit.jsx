import React, {Component} from "react";
import PropTypes from "prop-types";
import Dispatcher from "../../../dispatcher/Dispatcher";
import ActionCreator from "../../../actions/ActionCreator";
import {reduceMediaValuesToAllowedLanguages} from "../../../helpers/accessManagementHelper";
import {translate} from "react-i18next";
import TableauxConstants, {Langtags} from "../../../constants/TableauxConstants";
import connectToAmpersand from "../../helperComponents/connectToAmpersand";
import f from "lodash/fp";
import MultifileFileEdit from "./MultifileFileEdit";

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
    const {t, editedLanguage, file, hasChanged} = this.props;
    if (hasChanged) {
      const langDuplicates = f.flow(
        f.map((lt) => editedLanguage[lt] || lt), // select langtags or edited languages
        f.groupBy(f.identity), // collect equal langatags
        f.mapValues(f.size), // count occurence of langtags
        f.pickBy(f.lt(1)) // Select keys with 1 < N for any
      )(Langtags);

      if (!f.isEmpty(langDuplicates)) {
        const multiLanguageError = t("error_multifile_multiple_languages", {langtags: f.join(", ", f.keys(langDuplicates))});
        alert(multiLanguageError);
        return;
      } else {
        const fileFromProps = f.flow(
          f.update("title", this.props.editedTitleValue),
          f.update("description", this.props.editedDescValue),
          f.update("externalName", this.props.editedExternalnameValue)
        )(file);

        let changedFile = {
          title: {},
          description: {},
          externalName: {},
          internalName: {},
          mimeType: {}
        };
        for (let langToSwap in editedLanguage) {
          if (editedLanguage.hasOwnProperty(langToSwap)) {
            const langToSwapTo = editedLanguage[langToSwap];
            changedFile.title[langToSwapTo] = file.title[langToSwap] || null;
            changedFile.description[langToSwapTo] = file.description[langToSwap] || null;
            changedFile.externalName[langToSwapTo] = file.externalName[langToSwap] || null;
            changedFile.internalName[langToSwapTo] = file.internalName[langToSwap] || null;
            changedFile.mimeType[langToSwapTo] = file.mimeType[langToSwap] || null;
          }
        }
        
        const resultFile = f.flow(
          f.pick(["title", "description", "externalName", "internalName", "mimeType"]),
          f.merge(fileFromProps)
        )(changedFile);

        const changeFileParams = reduceMediaValuesToAllowedLanguages(
          f.pick(
            ["uuid", "title", "description", "externalName", "internalName", "mimeType", "folder", "fileUrl"],
            resultFile
          )
        );
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
      const {file, editedTitleValue, editedDescValue, editedExternalnameValue, editedLanguage} = this.props;
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
          onTitleChange={this.onTitleChange}
          onDescriptionChange={this.onDescriptionChange}
          onExternalnameChange={this.onExternalnameChange}
          onLangChange={this.onLangChange} />
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
