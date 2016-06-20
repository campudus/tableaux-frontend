var React = require('react');
var FileChangeUpload = require('./FileChangeUpload.jsx');
var LanguageSwitcher = require('../../header/LanguageSwitcher.jsx');
var apiUrl = require('../../../helpers/apiUrl');
import {isUserAdmin, hasUserAccessToLanguage, getUserLanguageAccess} from '../../../helpers/accessManagementHelper';
import {translate} from 'react-i18next';

var MultifileFileEdit = React.createClass({

  propTypes : {
    langtag : React.PropTypes.string.isRequired,
    originalLangtag : React.PropTypes.string.isRequired,
    fileData : React.PropTypes.object.isRequired,
    onTitleChange : React.PropTypes.func.isRequired,
    onDescriptionChange : React.PropTypes.func.isRequired,
    onExternalnameChange : React.PropTypes.func.isRequired,
    onLangChange : React.PropTypes.func.isRequired
  },

  componentWillMount : function () {
    this.titleId = "fileTitle_" + this.props.langtag;
    this.descId = "fileDescription_" + this.props.langtag;
    this.externalNameId = "fileLinkName" + this.props.langtag;
  },

  shouldComponentUpdate : function (nextProps) {
    return nextProps.fileData.title !== this.props.fileData.title ||
      nextProps.fileData.description !== this.props.fileData.description ||
      nextProps.fileData.externalName !== this.props.fileData.externalName ||
      nextProps.fileData.internalName !== this.props.fileData.internalName ||
      nextProps.langtag !== this.props.langtag;
  },

  onTitleChange : function (event) {
    this.props.onTitleChange(event.target.value, this.props.originalLangtag);
  },

  onDescriptionChange : function (event) {
    this.props.onDescriptionChange(event.target.value, this.props.originalLangtag);
  },

  onExternalNameChange : function (event) {
    this.props.onExternalnameChange(event.target.value, this.props.originalLangtag);
  },

  onLangChange : function (lang) {
    this.props.onLangChange(lang, this.props.originalLangtag);
  },

  render : function () {
    const {langtag, fileData, t} = this.props;
    const {internalName, uuid, description, externalName, title, fileUrl} = fileData;
    const permissionToChange = hasUserAccessToLanguage(langtag);

    const openFileLink = internalName && fileUrl ?
      <span className="open-file"><a target="_blank" href={apiUrl(fileUrl)}>{t('open_file')}</a></span> : null;

    return (
      <div className="multifile-file-edit">
        <div className="cover-wrapper">
          <div className="cover">
            <FileChangeUpload
              langtag={langtag}
              internalFileName={internalName}
              uuid={uuid}/>
          </div>
          {openFileLink}
        </div>
        <div className="properties-wrapper">
          <LanguageSwitcher
            langtag={langtag}
            onChange={this.onLangChange}
            disabled={!permissionToChange}
            limitLanguages={getUserLanguageAccess()}
          />
          <div className='field-item'>
            <label htmlFor={this.titleId} className="field-label">{t('file_title_label')}</label>
            <div className="field-input">
              <input disabled={!permissionToChange} type="text" className="field-text-input" id={this.titleId}
                     value={title}
                     onChange={this.onTitleChange}/>
            </div>
          </div>
          <div className='field-item'>
            <label htmlFor={this.descId} className="field-label">{t('file_description_label')}</label>
            <div className="field-input">
              <input disabled={!permissionToChange} type="text" className="field-text-input" id={this.descId}
                     value={description}
                     onChange={this.onDescriptionChange}/>
            </div>
          </div>
          <div className='field-item'>
            <label htmlFor={this.externalNameId} className="field-label">{t('file_link_name_label')}</label>
            <div className="field-input">
              <input disabled={!permissionToChange} type="text" className="field-text-input" id={this.externalNameId}
                     value={externalName}
                     onChange={this.onExternalNameChange}/>
            </div>
          </div>
        </div>
      </div>
    );
  }
});

module.exports = translate(['media'])(MultifileFileEdit);