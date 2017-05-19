import multiLanguage from "../../../helpers/multiLanguage";
import Folder from "../../../models/media/Folder";
import ActionCreator from "../../../actions/ActionCreator";
import connectToAmpersand from "../../helperComponents/connectToAmpersand";
import _ from "lodash";
import React, {Component, PropTypes} from "react";
import TableauxConstants from "../../../constants/TableauxConstants";
import apiUrl from "../../../helpers/apiUrl";
import {translate} from "react-i18next";
const {ColumnKinds} = TableauxConstants;

@connectToAmpersand
class AttachmentOverlay extends Component {

  static propTypes = {
    cell: PropTypes.object.isRequired,
    langtag: PropTypes.string.isRequired,
    folderId: PropTypes.any
  };

  constructor(props) {
    super(props);
    this.state = {folder: null};
  }

  componentWillMount() {
    if (this.props.cell.column.kind !== ColumnKinds.attachment) {
      console.error("Couldn't open AttachmentOverlay for this column type.");
      return;
    }
    const {folderId} = this.props;

    this.navigateFolder(_.isNumber(folderId) ? folderId : null)();
  }

  componentWillUnmount() {
    this.props.cell.fetch();
  }

  navigateFolder = (folderId) => () => {
    // TODO View creates Model instance
    if (this.state.folder) {
      this.setState({folder: null});
    }
    const folder = new Folder({id: folderId});

    folder.fetch({
      data: {langtag: this.props.langtag},
      success: (collection, response) => {
        this.setState({folder: response});
      },
      error: function (e) {
        throw new Error(e);
      }
    });
  };

  toggleAttachments = (isLinked, file) => {
    const cell = this.props.cell;

    return () => {
      let attachments = _.clone(cell.value);

      if (isLinked) {
        _.remove(attachments, function (attachment) {
          return file.uuid === attachment.uuid;
        });
      } else {
        attachments.push(file);
      }

      ActionCreator.changeCell(cell, attachments);
    };
  };

  getMediaFolderUrl = (folderId) => {
    return `/${this.props.langtag}/media/${folderId}`;
  };

  render() {
    const fallbackLang = TableauxConstants.DefaultLangtag;
    const retrieveTranslation = multiLanguage.retrieveTranslation(fallbackLang);
    const {langtag, t} = this.props;

    const backButton = (this.state.folder && this.state.folder.name !== "root")
      ? (
        <div className="back active" key={this.state.folder.id}>
          <a onClick={this.navigateFolder(this.state.folder.parent)}><i
            className="fa fa-chevron-left"></i>{t("folder_back")} </a>
          <span className="folder-name">{this.state.folder.name}</span>
        </div>
      )
      : (this.state.folder)
        ? (
          <div className="back" key={this.state.folder.id}><span className="folder-name">{t("root_folder_name")}</span>
          </div>
        )
        : null;

    // check for empty obj or map fails
    const listDisplay = (this.state.folder)
      ? (
        <div className="folder-file-list">
          <div className="folder-navigation">
            {backButton}
            <ul className="folder-list content-items">
              {this.state.folder.subfolders.map((subfolder) => {
                return <li className="item" key={subfolder.id} onClick={this.navigateFolder(subfolder.id)}>
                  <a><i className="icon fa fa-folder-open"></i> {subfolder.name}</a>
                </li>;
              })}
            </ul>
          </div>
          <ul className="file-list content-items">
            {this.state.folder.files.map((file) => {
              const folderId = file.folder;
              const currentCellValue = this.props.cell.value;
              const imageUrl = apiUrl(retrieveTranslation(file.fileUrl, langtag));

              const linked = _.find(currentCellValue, (linkedFile) => {
                return file.uuid === linkedFile.uuid;
              });

              const isLinked = !!linked;
              const fileTitle = retrieveTranslation(file.title, this.props.langtag);

              return <li key={file.uuid} className="item">
                <a onClick={this.toggleAttachments(isLinked, file)}
                   className={isLinked ? "item-header overlay-table-row isLinked" : "item-header overlay-table-row"}>
                  <i className="icon fa fa-file"></i><span>{fileTitle}</span>
                </a>
                <div className="media-options item-content">
                  <a className="file-link" target="_blank" href={imageUrl}>
                    <i className="icon fa fa-external-link"></i>{t("show_file")}
                  </a>
                  <a className="change-file" alt="edit" target="_blank" href={this.getMediaFolderUrl(folderId)}>
                    <i className="icon fa fa-pencil-square-o"></i>{t("change_file")}
                  </a>
                </div>
              </li>;
            })}
          </ul>
        </div>
      )
      : "Loading...";

    return (
      <div className="attachment-overlay-wrapper">
        {listDisplay}
      </div>
    );
  }
}

module.exports = translate(["media"])(AttachmentOverlay);
