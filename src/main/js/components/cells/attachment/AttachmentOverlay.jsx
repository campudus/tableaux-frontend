import multiLanguage from "../../../helpers/multiLanguage";
import Folder from "../../../models/media/Folder";
import ActionCreator from "../../../actions/ActionCreator";
import connectToAmpersand from "../../helperComponents/connectToAmpersand";
import _ from "lodash";
import React, {Component, PropTypes} from "react";
import TableauxConstants, {ColumnKinds} from "../../../constants/TableauxConstants";
import apiUrl from "../../../helpers/apiUrl";
import {translate} from "react-i18next";
import Spinner from "../../header/Spinner";
import SvgIcon from "../../helperComponents/SvgIcon";
import {AutoSizer, CellMeasurer, CellMeasurerCache, List} from "react-virtualized";
import f from "lodash/fp";

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
    this._cache = new CellMeasurerCache({
      fixedWidth: true,
      minHeight: 57,
      defaultHeight: 57
    });
  }

  retrieveTranslation = multiLanguage.retrieveTranslation(TableauxConstants.FallbackLanguage);

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

    return event => {
      event.stopPropagation();
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

  renderFileItem = ({index, style, parent}) => {
    const file = f.get(["folder", "files", index], this.state);
    const {langtag, cell} = this.props;
    const currentCellValue = cell.value;
    const imageUrl = apiUrl(this.retrieveTranslation(file.fileUrl, langtag));

    const linked = _.find(currentCellValue, (linkedFile) => {
      return file.uuid === linkedFile.uuid;
    });

    const isLinked = !!linked;
    const fileTitle = this.retrieveTranslation(file.title, langtag);

    return (file)
      ? (
        <CellMeasurer key={file.uuid}
                      cache={this._cache}
                      rowIndex={index}
                      parent={parent}
        >
          <FileItem style={style}
                    isLinked={isLinked}
                    toggleAttachment={this.toggleAttachments(isLinked, file)}
                    title={fileTitle}
                    url={imageUrl}
                    editorUrl={this.getMediaFolderUrl(file.folder)}
          />
        </CellMeasurer>
      )
      : null;
  };

  isLinked = (file) => {
    f.compose(
      f.contains(file.uuid),
      f.map(f.get("uuid"))
    )(this.props.cell.value);
  };

  render() {
    const {t} = this.props;
    const {folder} = this.state;

    const linkedFiles = f.compose(
      f.join(";"),
      f.map((str) => str.substr(0, 8)),
      f.map(f.get("uuid"))
    )(this.props.cell.value);

    const backButton = (folder && folder.name !== "root")
      ? (
        <div className="back active" key={folder.id}>
          <a onClick={this.navigateFolder(folder.parent)}>
            <i className="fa fa-chevron-left" />
            {t("folder_back")}
          </a>
          <span className="folder-name">{folder.name}</span>
        </div>
      )
      : (folder)
        ? (
          <div className="back" key={folder.id}>
            <div />
            <span className="folder-name">{t("root_folder_name")}</span>
          </div>
        )
        : null;

    // check for empty obj or map fails
    const listDisplay = (folder)
      ? (
        <div className="folder-file-list">
          <div className="folder-navigation">
            {backButton}
            <div className="folder-list-wrapper">
              <ul className="folder-list">
                {folder.subfolders.map((subfolder) => {
                  return <li className="" key={subfolder.id} onClick={this.navigateFolder(subfolder.id)}>
                    <a><i className="icon fa fa-folder-open"></i> {subfolder.name}</a>
                  </li>;
                })}
              </ul>
            </div>
          </div>
          <div className="file-list">
            <AutoSizer>
              {({width, height}) => (
                <List height={height}
                      deferredMeasurementCache={this._cache}
                      rowHeight={this._cache.rowHeight}
                      rowRenderer={this.renderFileItem}
                      rowCount={f.size(folder.files)}
                      width={width}
                      linkedFiles={linkedFiles}
                />
              )}
            </AutoSizer>
          </div>
        </div>
      )
      : <Spinner isLoading={true} />;

    return (
      <div className="attachment-overlay-wrapper">
        {listDisplay}
      </div>
    );
  }
}

const FileItem = translate(["media", "common"])(
  (props) => {
    const {isLinked, toggleAttachment, title, url, editorUrl, t, style} = props;

    return (
      <div className="file-wrapper"
           style={style}
      >
        <div className={isLinked ? "file is-linked" : "file"}>
          <a onClick={toggleAttachment}
             className={"overlay-table-row"}>
            <i className="icon fa fa-file" /><span>{title}</span>
            {(isLinked) ? <SvgIcon icon="cross" /> : <SvgIcon icon="check" />}
          </a>
          <div className="media-options">
            <a className="file-link" href="#" onClick={() => window.open(url)}>
              <i className="icon fa fa-external-link" />{t("show_file")}
            </a>
            <a className="change-file" alt="edit" href="#" onClick={() => window.open(editorUrl)}>
              <i className="icon fa fa-pencil-square-o" />{t("change_file")}
            </a>
          </div>
        </div>
      </div>
    );
  }
);

module.exports = translate(["media", "common"])(AttachmentOverlay);
