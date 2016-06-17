var React = require('react');
var App = require('ampersand-app');
var ampersandMixin = require('ampersand-react-mixin');
var XhrPoolMixin = require('../../mixins/XhrPoolMixin');
var Dropzone = require('react-dropzone');
var request = require('superagent');
var ActionCreator = require('../../../actions/ActionCreator');
var multiLanguage = require('../../../helpers/multiLanguage');
var SingleFileTextInput = require('./SingleFileTextInput.jsx');
var FileChangeUpload = require('./FileChangeUpload.jsx');
var Dispatcher = require('../../../dispatcher/Dispatcher');
var apiUrl = require('../../../helpers/apiUrl');
var LanguageSwitcher = require('../../header/LanguageSwitcher.jsx');
import {isUserAdmin, hasUserAccessToLanguage, getUserLanguageAccess, reduceMediaValuesToAllowedLanguages} from '../../../helpers/accessManagementHelper';
import {DefaultLangtag} from '../../../constants/TableauxConstants';
import {translate} from 'react-i18next';
import _ from 'lodash';

var SingleFileEdit = React.createClass({

  mixins : [ampersandMixin, XhrPoolMixin],

  propTypes : {
    file : React.PropTypes.object.isRequired,
    langtag : React.PropTypes.string.isRequired,
    onClose : React.PropTypes.func.isRequired,
    editedTitleValue : React.PropTypes.object.isRequired,
    editedDescValue : React.PropTypes.object.isRequired,
    editedExternalnameValue : React.PropTypes.object.isRequired,
    hasChanged : React.PropTypes.bool.isRequired,
    onTitleChange : React.PropTypes.func.isRequired,
    onDescriptionChange : React.PropTypes.func.isRequired,
    onExternalnameChange : React.PropTypes.func.isRequired
  },

  getInitialState : function () {
    return {
      isTitleOpen : false,
      isDescriptionOpen : false,
      isExternalnameOpen : false,
      multifileLanguage : App.langtags[1]
    }
  },

  componentWillMount : function () {
    Dispatcher.on("on-media-overlay-save", this.onSave);
    Dispatcher.on("on-media-overlay-cancel", this.onClose);
  },

  componentWillUnmount : function () {
    Dispatcher.off("on-media-overlay-save", this.onSave);
    Dispatcher.off("on-media-overlay-cancel", this.onClose);
  },

  onSave : function () {
    if (this.props.hasChanged) {
      var file = this.props.file;
      var newTitle = this.props.editedTitleValue;
      var newDescription = this.props.editedDescValue;
      var newExternalName = this.props.editedExternalnameValue;
      const changeFileParams = reduceMediaValuesToAllowedLanguages([file.uuid, newTitle, newDescription, newExternalName, file.internalName, file.mimeType, file.folder, file.fileUrl]);
      console.log("got obj after reduceMediaValuesToAllowedLanguages: ", changeFileParams);
      ActionCreator.changeFile(...changeFileParams);
    }
    this.props.onClose(event)
  },

  onClose : function (event) {
    const {t} = this.props;
    if (this.props.hasChanged) {
      if (confirm(t('file_close_without_saving'))) {
        this.props.onClose(event)
      }
    } else {
      this.props.onClose(event)
    }
  },

  onTitleChange : function (titleValue, langtag) {
    this.props.onTitleChange(titleValue, langtag);
  },

  toggleTitle : function () {
    this.setState({
      isTitleOpen : !this.state.isTitleOpen
    });
  },

  onDescChange : function (descValue, langtag) {
    this.props.onDescriptionChange(descValue, langtag);
  },

  toggleDesc : function () {
    this.setState({
      isDescriptionOpen : !this.state.isDescriptionOpen
    });
  },

  onExternalnameChange : function (externalnameValue, langtag) {
    this.props.onExternalnameChange(externalnameValue, langtag);
  },

  toggleExternalname : function () {
    this.setState({
      isExternalnameOpen : !this.state.isExternalnameOpen
    });
  },

  onMultifileLanguageChange : function (lang) {
    this.setState({
      multifileLanguage : lang
    });
  },

  onMultilangDrop : function (files) {
    var self = this;
    var langtag = this.state.multifileLanguage;

    files.forEach(function (file) {
      // upload each file for it's own
      var uuid = self.props.file.uuid;

      var uploadUrl = apiUrl("/files/" + uuid + "/" + langtag);

      var req = request.put(uploadUrl)
        .attach("file", file, file.name)
        .end(self.multilangUploadCallback);

      self.addAbortableXhrRequest(req.xhr);
    });
  },

  multilangUploadCallback : function (err, uploadRes) {
    if (err) {
      console.error("FileDelete.uploadCallback", err);
      return;
    }

    if (uploadRes) {
      var file = uploadRes.body;
      ActionCreator.changedFileData(file.uuid, file.title, file.description, file.externalName, file.internalName, file.mimeType, file.folder, file.url);
    }
  },

  renderTextInput : function (id, label, valueObj, langtag, isOpen) {
    var self = this;
    var retrieveTranslation = multiLanguage.retrieveTranslation(App.langtags[0]);

    if (isOpen) {
      return (App.langtags.map(function (langtag) {
        var value = retrieveTranslation(valueObj, langtag);
        return self.renderField(id, value, langtag);
      }));
    } else {
      var value = retrieveTranslation(valueObj, langtag);
      return (
        <div className='field-item'>
          <label htmlFor={id} className="field-label">{label}</label>
          {this.renderField(id, value, langtag)}
        </div>
      );
    }
  },

  render : function () {
    const {t} = this.props;
    const {internalName, fileUrl, uuid} = this.props.file;

    var langOptions = App.langtags.reduce(function (res, langtag) {
      if (DefaultLangtag !== langtag && hasUserAccessToLanguage(langtag)) {
        res.push({
          value : langtag,
          label : langtag
        });
      }
      return res;
    }, []);

    var fileLangtag = Object.keys(internalName)[0];
    var fileInternalName = internalName[fileLangtag];
    const fileUrlOfThisLanguage = apiUrl(fileUrl[App.defaultLangtag]);

    return (
      <div className="singlefile-edit">
        <div className="cover-wrapper">
          <div className="cover">
            <FileChangeUpload isSingleFile={true} langtag={fileLangtag} internalFileName={fileInternalName}
                              uuid={uuid}/>
          </div>
          <span className="open-file"><a target="_blank" href={fileUrlOfThisLanguage}>{t('open_file')}</a></span>
        </div>
        <div className="properties-wrapper">
          <SingleFileTextInput name="fileTitle"
                               labelText={t('file_title_label')}
                               originalValue={this.props.file.title}
                               editedValue={this.props.editedTitleValue}
                               langtag={this.props.langtag}
                               isOpen={this.state.isTitleOpen}
                               onToggle={this.toggleTitle}
                               onChange={this.onTitleChange}/>

          <SingleFileTextInput name="fileDescription"
                               labelText={t('file_description_label')}
                               originalValue={this.props.file.description}
                               editedValue={this.props.editedDescValue}
                               langtag={this.props.langtag}
                               isOpen={this.state.isDescriptionOpen}
                               onToggle={this.toggleDesc}
                               onChange={this.onDescChange}/>

          <SingleFileTextInput name="fileLinkName"
                               labelText={t('file_link_name_label')}
                               originalValue={this.props.file.externalName}
                               editedValue={this.props.editedExternalnameValue}
                               langtag={this.props.langtag}
                               isOpen={this.state.isExternalnameOpen}
                               onToggle={this.toggleExternalname}
                               onChange={this.onExternalnameChange}/>
        </div>

        <div className="multifile-wrapper">
          <Dropzone onDrop={this.onMultilangDrop} className="dropzone" multiple={false}>
            <div className="convert-multilanguage-note">
              <h4>{t('convert_multilanguage_hl')}</h4>
              <p>{t('convert_multilanguage_description')}</p>
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
});

module.exports = translate(['media'])(SingleFileEdit);