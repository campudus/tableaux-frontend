import i18n from "i18next";
import f from "lodash/fp";
import React from "react";
import { AutoSizer, List } from "react-virtualized";
import {
  compose,
  lifecycle,
  withHandlers,
  withProps,
  withStateHandlers
} from "recompose";
import { FilterModes } from "../../../constants/TableauxConstants";
import { makeRequest } from "../../../helpers/apiHelper";
import apiRoute from "../../../helpers/apiRoutes";
import apiUrl from "../../../helpers/apiUrl";
import { doto, forkJoin } from "../../../helpers/functools";
import multiLanguage from "../../../helpers/multiLanguage";
import SearchFunctions from "../../../helpers/searchFunctions";
import Spinner from "../../header/Spinner";
import { connectOverlayToCellValue } from "../../helperComponents/connectOverlayToCellHOC";
import FileItem from "./AttachmentOverlayFileItem";
import AttachmentOverlayFilter from "./AttachmentOverlayFilter";
import FolderList from "./AttachmentOverlayFolderList";

const NewAttachmentOverlay = props => {
  const {
    actions,
    cell,
    filter,
    filteredFileList,
    folder,
    navigateFolder,
    setFilter,
    value
  } = props;

  const isLinked = file =>
    f.flow(
      f.map("uuid"),
      f.contains(file.uuid)
    )(value);

  const filesKey =
    f.flow(
      f.map(
        forkJoin(
          (a, b) => a + b,
          file => (isLinked(file) ? "++" : "--"),
          file => file.uuid.substring(0, 8)
        )
      ),
      f.join(";")
    )(value) +
    filter.mode +
    filter.value +
    filter.sorting;

  console.log("FILES KEY", filesKey);

  const backButton =
    folder && folder.name !== "root" ? (
      <div className="back active" key={folder.id}>
        <a onClick={() => navigateFolder(folder.parent)}>
          <i className="fa fa-chevron-left" />
          {i18n.t("media:folder_back")}
        </a>
        <span className="folder-name">{folder.name}</span>
      </div>
    ) : folder ? (
      <div className="back" key={folder.id}>
        <div />
        <span className="folder-name">{i18n.t("media:root_folder_name")}</span>
      </div>
    ) : null;

  const toggleAttachments = (isLinked, file) => event => {
    event.stopPropagation();

    const attachments = isLinked
      ? f.remove(f.matchesProperty("uuid", file.uuid), value)
      : [...value, file];

    actions.changeCellValue({
      columnId: cell.column.id,
      rowId: cell.row.id,
      tableId: cell.table.id,
      oldValue: value,
      newValue: attachments,
      method: "PUT"
    });
  };

  const renderFileItem = ({ index, style }) => {
    const file = f.get(index, filteredFileList);
    if (!file) {
      console.log("empty file", index);
      return null;
    }
    const imageUrl = apiUrl(
      multiLanguage.retrieveTranslation(props.langtag, file.url)
    );

    const linked = isLinked(file);
    const fileTitle = multiLanguage.retrieveTranslation(
      props.langtag,
      file.title
    );

    return (
      <FileItem
        key={file.uuid}
        style={style}
        isLinked={linked}
        toggleAttachment={toggleAttachments(linked, file)}
        title={fileTitle}
        url={imageUrl}
        editorUrl={apiRoute.toFolder(file.folder.id)}
      />
    );
  };

  console.log("File list:", filteredFileList);

  return (
    <div className="attachment-overlay-wrapper">
      {folder ? (
        <div className="folder-file-list">
          <div className="folder-navigation">
            {backButton}
            <FolderList folder={folder} navigateFolder={navigateFolder} />
          </div>
          <div className="file-list">
            <AttachmentOverlayFilter
              setFilter={setFilter}
              filterMode={filter.mode}
              filterValue={filter.value}
              sortOrder={filter.sorting}
            />
            <div className="real-file-list">
              <AutoSizer>
                {({ width, height }) => (
                  <List
                    height={height}
                    rowHeight={63}
                    rowRenderer={renderFileItem}
                    rowCount={f.size(filteredFileList)}
                    width={width}
                    filesKey={filesKey}
                  />
                )}
              </AutoSizer>
            </div>
          </div>
        </div>
      ) : (
        <Spinner isLoading={true} />
      )}
    </div>
  );
};

const withFolderLoader = compose(
  withStateHandlers(
    { folder: null, filter: {} },
    {
      setCurrentFolder: () => folder => ({ folder }),

      setFilter: (state, props) => ({
        mode = state.filter.mode || FilterModes.CONTAINS,
        value = state.filter.value || "",
        sorting = state.filter.sorting || 0
      }) => {
        console.log("Setting filter to", state.folder);
        const isLinked = file =>
          f.any(f.propEq("uuid", file.uuid), props.value);

        const getSortValue = file =>
          (isLinked(file) ? "0_" : "1_") +
          (sorting === 0
            ? multiLanguage.retrieveTranslation(props.langtag, file.title)
            : file.createdAt);

        const filterFn = file =>
          f.isEmpty(value)
            ? true
            : isLinked(file) ||
              SearchFunctions[mode](
                value,
                multiLanguage.retrieveTranslation(props.langtag, file.title)
              );

        return {
          filter: { mode, value, sorting },
          filteredFileList: doto(
            state.folder,
            f.propOr([], "files"),
            f.filter(filterFn),
            f.sortBy(getSortValue)
          )
        };
      }
    }
  ),
  withHandlers({
    navigateFolder: ({ setCurrentFolder, setFilter, langtag }) => folderId => {
      makeRequest({
        apiRoute: apiRoute.toFolder(folderId),
        params: { langtag }
      })
        .then(setCurrentFolder)
        .then(() => setFilter({ value: "" }))
        .catch(console.error);
      setCurrentFolder(null);
    },
    applyFilter: ({ filter, langtag, value, folder }) => () => {
      const mode = filter.mode || FilterModes.CONTAINS;
      const filterValue = filter.value || "";
      const sorting = filter.sorting || 0;
      const isLinked = file => f.any(f.propEq("uuid", file.uuid), value);

      const getSortValue = file =>
        (isLinked(file) ? "0_" : "1_") +
        (sorting === 0
          ? multiLanguage.retrieveTranslation(langtag, file.title)
          : file.createdAt);

      const filterFn = file =>
        f.isEmpty(filterValue)
          ? true
          : isLinked(file) ||
            SearchFunctions[mode](
              filterValue,
              multiLanguage.retrieveTranslation(langtag, file.title)
            );

      return doto(
        folder,
        f.propOr([], "files"),
        f.filter(filterFn),
        f.sortBy(getSortValue)
      );
    }
  }),
  lifecycle({
    componentDidMount() {
      this.props.navigateFolder(this.props.folderId);
    }
  }),
  withProps(({ applyFilter }) => ({ filteredFileList: applyFilter() }))
);

export default compose(
  connectOverlayToCellValue,
  withFolderLoader
)(NewAttachmentOverlay);
