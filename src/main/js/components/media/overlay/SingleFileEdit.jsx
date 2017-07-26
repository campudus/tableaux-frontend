import React from "react";
import connectToAmpersand from "../../helperComponents/connectToAmpersand";
import withAbortableXhrRequests from "../../helperComponents/withAbortableXhrRequests";
import Dropzone from "react-dropzone";
import request from "superagent";
import ActionCreator from "../../../actions/ActionCreator";
import multiLanguage from "../../../helpers/multiLanguage";
import SingleFileTextInput from "./SingleFileTextInput.jsx";
import FileChangeUpload from "./FileChangeUpload.jsx";
import Dispatcher from "../../../dispatcher/Dispatcher";
import apiUrl from "../../../helpers/apiUrl";
import LanguageSwitcher from "../../header/LanguageSwitcher.jsx";
import {hasUserAccessToLanguage, reduceMediaValuesToAllowedLanguages} from "../../../helpers/accessManagementHelper";
import {DefaultLangtag, Langtags} from "../../../constants/TableauxConstants";
import {translate} from "react-i18next";

@translate(["media"])
@withAbortableXhrRequests
@connectToAmpersand
class SingleFileEdit extends React.Component {

  static propTypes = {
    file: React.PropTypes.object.isRequired,
    langtag: React.PropTypes.string.isRequired,
    onClose: React.PropTypes.func.isRequired,
    editedTitleValue: React.PropTypes.object.isRequired,
    editedDescValue: React.PropTypes.object.isRequired,
    editedExternalnameValue: React.PropTypes.object.isRequired,
    hasChanged: React.PropTypes.bool.isRequired,
    onTitleChange: React.PropTypes.func.isRequired,
    onDescriptionChange: React.PropTypes.func.isRequired,
    onExternalnameChange: React.PropTypes.func.isRequired
  };

  constructor(props) {
    super(props);
    this.state = {
      isTitleOpen: false,
      isDescriptionOpen: false,
      isExternalnameOpen: false,
      multifileLanguage: Langtags.length > 0 ? Langtags[1] : DefaultLangtag
    };
  }

  componentWillMount() {
    Dispatcher.on("on-media-overlay-save", this.onSave);
    Dispatcher.on("on-media-overlay-cancel", this.onClose);
  }

  componentWillUnmount() {
    Dispatcher.off("on-media-overlay-save", this.onSave);
    Dispatcher.off("on-media-overlay-cancel", this.onClose);
  }

  onSave = () => {
    if (this.props.hasChanged) {
      const file = this.props.file;
      const newTitle = this.props.editedTitleValue;
      const newDescription = this.props.editedDescValue;
      const newExternalName = this.props.editedExternalnameValue;
      const changeFileParams = reduceMediaValuesToAllowedLanguages([file.uuid, newTitle, newDescription, newExternalName, file.internalName, file.mimeType, file.folder, file.fileUrl]);
      console.log("got obj after reduceMediaValuesToAllowedLanguages: ", changeFileParams);
      ActionCreator.changeFile(...changeFileParams);
    }
    this.props.onClose(event);
  };

  onClose = (event) => {
    const {t} = this.props;
    if (this.props.hasChanged) {
      if (confirm(t("file_close_without_saving"))) {
        this.props.onClose(event);
      }
    } else {
      this.props.onClose(event);
    }
  };

  onTitleChange = (titleValue, langtag) => {
    this.props.onTitleChange(titleValue, langtag);
  };

  toggleTitle = () => {
    this.setState({
      isTitleOpen: !this.state.isTitleOpen
    });
  };

  onDescChange = (descValue, langtag) => {
    this.props.onDescriptionChange(descValue, langtag);
  };

  toggleDesc = () => {
    this.setState({
      isDescriptionOpen: !this.state.isDescriptionOpen
    });
  };

  onExternalnameChange = (externalnameValue, langtag) => {
    this.props.onExternalnameChange(externalnameValue, langtag);
  };

  toggleExternalname = () => {
    this.setState({
      isExternalnameOpen: !this.state.isExternalnameOpen
    });
  };

  onMultifileLanguageChange = (lang) => {
    this.setState({
      multifileLanguage: lang
    });
  };

  onMultilangDrop = (files) => {
    const langtag = this.state.multifileLanguage;

    files.forEach((file) => {
      // upload each file for it's own
      const uuid = this.props.file.uuid;

      const uploadUrl = apiUrl("/files/" + uuid + "/" + langtag);

      const req = request.put(uploadUrl)
        .attach("file", file, file.name)
        .end(this.multilangUploadCallback);

      this.props.addAbortableXhrRequest(req.xhr);
    });
  };

  multilangUploadCallback = (err, uploadRes) => {
    if (err) {
      console.error("FileDelete.uploadCallback", err);
      return;
    }

    if (uploadRes) {
      const file = uploadRes.body;
      ActionCreator.changedFileData(file.uuid, file.title, file.description, file.externalName, file.internalName, file.mimeType, file.folder, file.url);
    }
  };

  renderTextInput = (id, label, valueObj, langtag, isOpen) => {
    const retrieveTranslation = multiLanguage.retrieveTranslation(DefaultLangtag);

    if (isOpen) {
      return (Langtags.map((langtag) => {
        const value = retrieveTranslation(valueObj, langtag);
        return this.renderField(id, value, langtag);
      }));
    } else {
      const value = retrieveTranslation(valueObj, langtag);
      return (
        <div className='field-item'>
          <label htmlFor={id} className="field-label">{label}</label>
          {this.renderField(id, value, langtag)}
        </div>
      );
    }
  };

  render() {
    const {t} = this.props;
    const {internalName, fileUrl, uuid} = this.props.file;

    const langOptions = Langtags.reduce((res, langtag) => {
      if (DefaultLangtag !== langtag && hasUserAccessToLanguage(langtag)) {
        res.push({
          value: langtag,
          label: langtag
        });
      }
      return res;
    }, []);

    const fileLangtag = Object.keys(internalName)[0];
    const fileInternalName = internalName[fileLangtag];
    const fileUrlOfThisLanguage = apiUrl(fileUrl[DefaultLangtag]);

    return (
      <div className="singlefile-edit">
        <div className="item cover-wrapper">
          <div className="cover">
            <FileChangeUpload isSingleFile={true} langtag={fileLangtag} internalFileName={fileInternalName}
                              uuid={uuid}/>
          </div>
          <span className="open-file"><a target="_blank" rel="noopener" href={fileUrlOfThisLanguage}>{t("open_file")}</a></span>
        </div>
        <div className="properties-wrapper content-items">
          <SingleFileTextInput name="fileTitle"
                               labelText={t("file_title_label")}
                               originalValue={this.props.file.title}
                               editedValue={this.props.editedTitleValue}
                               langtag={this.props.langtag}
                               isOpen={this.state.isTitleOpen}
                               onToggle={this.toggleTitle}
                               onChange={this.onTitleChange}/>

          <SingleFileTextInput name="fileDescription"
                               labelText={t("file_description_label")}
                               originalValue={this.props.file.description}
                               editedValue={this.props.editedDescValue}
                               langtag={this.props.langtag}
                               isOpen={this.state.isDescriptionOpen}
                               onToggle={this.toggleDesc}
                               onChange={this.onDescChange}/>

          <SingleFileTextInput name="fileLinkName"
                               labelText={t("file_link_name_label")}
                               originalValue={this.props.file.externalName}
                               editedValue={this.props.editedExternalnameValue}
                               langtag={this.props.langtag}
                               isOpen={this.state.isExternalnameOpen}
                               onToggle={this.toggleExternalname}
                               onChange={this.onExternalnameChange}/>
        </div>

        <div className="multifile-wrapper item">
          <Dropzone onDrop={this.onMultilangDrop} className="item dropzone" multiple={false}>
            <div className="convert-multilanguage-note">
              <h4>{t("convert_multilanguage_hl")}</h4>
              <p>{t("convert_multilanguage_description")}</p>
            </div>
          </Dropzone>
          <LanguageSwitcher
            options={langOptions}
            openOnTop
            onChange={this.onMultifileLanguageChange}
            langtag={this.state.multifileLanguage}/>
        </div>
      </div>
    );
  }
}

module.exports = SingleFileEdit;
