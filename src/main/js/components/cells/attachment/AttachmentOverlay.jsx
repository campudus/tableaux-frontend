import multiLanguage from "../../../helpers/multiLanguage";
import Folder from "../../../models/media/Folder";
import ActionCreator from "../../../actions/ActionCreator";
import connectToAmpersand from "../../helperComponents/connectToAmpersand";
import React, {Component} from "react";
import PropTypes from "prop-types";
import TableauxConstants, {ColumnKinds, FilterModes} from "../../../constants/TableauxConstants";
import apiUrl from "../../../helpers/apiUrl";
import {translate} from "react-i18next";
import Spinner from "../../header/Spinner";
import SvgIcon from "../../helperComponents/SvgIcon";
import {AutoSizer, List} from "react-virtualized";
import f from "lodash/fp";
import AttachmentOverlayFilter from "./AttachmentOverlayFilter";
import SearchFunctions from "../../../helpers/searchFunctions";

@connectToAmpersand
class AttachmentOverlay extends Component {
  static propTypes = {
    cell: PropTypes.object.isRequired,
    langtag: PropTypes.string.isRequired,
    folderId: PropTypes.any
  };

  constructor(props) {
    super(props);
    this.state = {
      folder: null,
      filter: {sorting: 0},
      filteredFileList: []
    };
  }

  retrieveTranslation = multiLanguage.retrieveTranslation(TableauxConstants.FallbackLanguage);

  componentWillMount() {
    if (this.props.cell.column.kind !== ColumnKinds.attachment) {
      console.error("Couldn't open AttachmentOverlay for this column type.");
      return;
    }
    const {folderId} = this.props;

    this.navigateFolder(f.isNumber(folderId) ? folderId : null)();
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
        this.setState({folder: response}, () => this.setFilter({value: ""}));
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
      const {value} = cell;

      const attachments = (isLinked)
        ? f.remove(f.matchesProperty("uuid", file.uuid), value)
        : [...value, file];

      ActionCreator.changeCell(cell, attachments);
    };
  };

  getMediaFolderUrl = (folderId) => {
    return `/${this.props.langtag}/media/${folderId}`;
  };

  renderFileItem = ({index, style, parent}) => {
    const files = this.state.filteredFileList;
    const file = f.get(index, files);
    const {langtag} = this.props;
    const imageUrl = apiUrl(this.retrieveTranslation(file.fileUrl, langtag));

    const isLinked = this.isLinked(file);
    const fileTitle = this.retrieveTranslation(file.title, langtag);

    return (file)
      ? (
          <FileItem key={file.uuid}
                    style={style}
                    isLinked={isLinked}
                    toggleAttachment={this.toggleAttachments(isLinked, file)}
                    title={fileTitle}
                    url={imageUrl}
                    editorUrl={this.getMediaFolderUrl(file.folder)}
          />
      )
      : null;
  };

  setFilter = (
    {
      mode = this.state.filter.mode || FilterModes.CONTAINS,
      value = this.state.filter.value || "",
      sorting = this.state.filter.sorting || 0
    }) => {
    const getSortValue = (file) => (
      ((this.isLinked(file)) ? "0_" : "1_") +
      ((sorting === 0) ? this.retrieveTranslation(file.title, this.props.langtag) : file.createdAt)
    );

    const filterFn = (file) => (f.isEmpty(value))
      ? true
      : this.isLinked(file) || SearchFunctions[mode](value, this.retrieveTranslation(file.title, this.props.langtag));

    this.setState(f.flow(
      f.update(["filter", "mode"], f.always(mode)),
      f.update(["filter", "value"], f.always(value)),
      f.update(["filter", "sorting"], f.always(sorting)),
      (state) => f.assoc("filteredFileList", f.flow(
        f.get(["folder", "files"]),
        f.filter(filterFn),
        f.sortBy(getSortValue)
      )(state), state)
    ));
  };

  isLinked = (file) => f.flow(
    f.map("uuid"),
    f.contains(file.uuid)
  )(this.props.cell.value);

  render() {
    const {t} = this.props;
    const {folder, filter} = this.state;

    const filesKey = f.flow(
      f.map(f.flow(f.get("uuid"), (str) => str.substr(0, 8))),
      f.join(";")
    )(this.props.cell.value) + filter.mode + filter.value + filter.sorting;

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
            <AttachmentOverlayFilter setFilter={this.setFilter}
                                     filterMode={filter.mode}
                                     filterValue={filter.value}
                                     sortOrder={filter.sorting}
            />
            <AutoSizer>
              {({width, height}) => (
                <List height={height}
                  rowHeight={63}
                  rowRenderer={this.renderFileItem}
                  rowCount={f.size(this.state.filteredFileList)}
                  width={width}
                  filesKey={filesKey}
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
