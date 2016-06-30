var React = require('react');
var _ = require('lodash');
var AmpersandMixin = require('ampersand-react-mixin');
var ActionCreator = require('../../../actions/ActionCreator');
var Folder = require('../../../models/media/Folder');
var multiLanguage = require('../../../helpers/multiLanguage');
import TableauxConstants from '../../../constants/TableauxConstants';
import apiUrl from '../../../helpers/apiUrl';
const {ColumnKinds} = TableauxConstants;
import {translate} from 'react-i18next';

var AttachmentOverlay = React.createClass({
  mixins : [AmpersandMixin],

  propTypes : {
    cell : React.PropTypes.object.isRequired,
    langtag : React.PropTypes.string.isRequired
  },

  getInitialState : function () {
    return {
      folder : null
    };
  },

  componentWillMount : function () {
    if (this.props.cell.column.kind !== ColumnKinds.attachment) {
      console.error("Couldn't open AttachmentOverlay for this column type.");
      return;
    }

    this.navigateFolder(null)();
  },

  componentWillUnmount : function () {
    this.props.cell.fetch();
  },

  navigateFolder : function (folderId) {
    var self = this;

    return function () {
      // TODO View creates Model instance
      if (self.state.folder) {
        self.setState({folder : null});
      }
      var folder = new Folder({id : folderId});

      folder.fetch({
        data : {langtag : self.props.langtag},
        success : function (err, result) {
          self.setState({folder : result});
        }
      });
    };
  },

  toggleAttachments : function (isLinked, file) {
    var cell = this.props.cell;

    return function () {
      var attachments = _.clone(cell.value);

      if (isLinked) {
        _.remove(attachments, function (attachment) {
          return file.uuid === attachment.uuid;
        });
      } else {
        attachments.push(file);
      }

      ActionCreator.changeCell(cell, attachments);
    };
  },

  getMediaFolderUrl(folderId){
    return `/${this.props.langtag}/media/${folderId}`;
  },

  render : function () {
    var self = this;
    var fallbackLang = TableauxConstants.DefaultLangtag;
    var retrieveTranslation = multiLanguage.retrieveTranslation(fallbackLang);
    var listDisplay = "Loading...";
    const {langtag, t} = this.props;

    //check for empty obj or map fails
    if (this.state.folder) {
      // render back button
      var backButton = null;
      if (this.state.folder && this.state.folder.name !== "root") {
        backButton = (
          <div className="back active" key={this.state.folder.id}>
            <a onClick={self.navigateFolder(this.state.folder.parent)}><i
              className="fa fa-chevron-left"></i>{t('folder_back')} </a>
            <span className="folder-name">{this.state.folder.name}</span>
          </div>);
      } else {
        backButton = (
          <div className="back" key={this.state.folder.id}><span className="folder-name">{t('root_folder_name')}</span>
          </div>);
      }

      listDisplay = (
        <div className="folder-file-list">
          <div className="folder-navigation">
            {backButton}
            <ul className="folder-list">
              {this.state.folder.subfolders.map(function (subfolder) {
                return <li key={subfolder.id} onClick={self.navigateFolder(subfolder.id)}>
                  <a><i className="icon fa fa-folder-open"></i> {subfolder.name}</a>
                </li>
              })}
            </ul>
          </div>
          <ul className="file-list">
            {this.state.folder.files.map(function (file) {
              const folderId = file.folder;
              var currentCellValue = self.props.cell.value;
              const imageUrl = apiUrl(retrieveTranslation(file.fileUrl, langtag));

              var linked = _.find(currentCellValue, function (linkedFile) {
                return file.uuid === linkedFile.uuid;
              });

              var isLinked = linked ? true : false;
              var fileTitle = retrieveTranslation(file.title, self.props.langtag);

              return <li key={file.uuid} onClick={self.toggleAttachments(isLinked, file)}>
                <a className={isLinked ? 'overlay-table-row isLinked' : 'overlay-table-row'}>
                  <i className="icon fa fa-file"></i><span>{fileTitle}</span>
                </a>
                <div className="media-options">
                  <a className="file-link" target="_blank" href={imageUrl}>
                    <i className="icon fa fa-external-link"></i>{t('show_file')}
                  </a>
                  <a className="change-file" alt="edit" target="_blank" href={self.getMediaFolderUrl(folderId)}>
                    <i className="icon fa fa-pencil-square-o"></i>{t('change_file')}
                  </a>
                </div>
              </li>
            })}
          </ul>
        </div>
      );
    }

    return (
      <div className="attachment-overlay-wrapper">
        {listDisplay}
      </div>
    );
  }

});

module.exports = translate(['media'])(AttachmentOverlay);
