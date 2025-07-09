import f from "lodash/fp";
import i18n from "i18next";
import { ReactElement, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useHistory } from "react-router-dom";
import { switchLanguageHandler } from "../Router";
import GrudHeader from "../GrudHeader";
import Spinner from "../header/Spinner";
import { MediaState } from "../../redux/reducers/media";
import { simpleError } from "../overlay/ConfirmationOverlay";
import FileUpload from "./folder/FileUpload";
import Dropzone from "react-dropzone";
import { canUserCreateFiles } from "../../helpers/accessManagementHelper";
import FolderBreadcrumbs from "./folder/FolderBreadcrumbs";
import FolderToolbar, { Layout } from "./folder/FolderToolbar";
import { createMediaFolder } from "../../redux/actions/mediaActions";
import FolderDirents from "./folder/FolderDirents";

type ReduxState = { media: MediaState };

type MediaViewProps = {
  langtag: string;
  folderId?: string;
};

export default function MediaView({ langtag }: MediaViewProps): ReactElement {
  const [layout, setLayout] = useState<Layout>("list");
  const dropzoneRef = useRef<Dropzone>(null);
  const history = useHistory();
  const dispatch = useDispatch();
  const media = useSelector<ReduxState, MediaState>(state => state.media);
  const folder = media.data;
  const folderPrev = useRef(folder);
  const folderIdPrev = folderPrev.current.id;
  const fileIds = media.data.files?.map(({ uuid }) => uuid) ?? [];
  const fileIdsPrev = folderPrev.current.files?.map(({ uuid }) => uuid) ?? [];
  const fileIdsDiff =
    folderIdPrev === folder.id ? f.difference(fileIds, fileIdsPrev) : [];

  const handleLanguageSwitch = (newLangtag: string) => {
    switchLanguageHandler(history, newLangtag);
  };

  const handleClickUpload = () => {
    dropzoneRef.current?.open();
  };

  const handleClickNewFolder = () => {
    dispatch(
      createMediaFolder({
        parentId: folder.id,
        name: i18n.t("media:new_folder"),
        description: ""
      })
    );
  };

  const handleSelectLayout = (layout: Layout) => {
    setLayout(layout);
  };

  useEffect(() => {
    folderPrev.current = folder;
  }, [folder]);

  if (media.error) {
    simpleError();
  }

  return (
    <>
      <GrudHeader
        langtag={langtag}
        handleLanguageSwitch={handleLanguageSwitch}
      />

      {!media.finishedLoading && <Spinner isLoading />}

      <div className="media-view">
        <div className="media-view__card">
          <h4 className="media-view__title">{i18n.t("media:title")}</h4>

          <FolderToolbar
            className="media-view__toolbar"
            onLayoutChange={handleSelectLayout}
            onUploadClick={handleClickUpload}
            onNewFolderClick={handleClickNewFolder}
          />

          <FolderBreadcrumbs
            className="media-view__breadcrumbs"
            langtag={langtag}
            folder={folder}
          />

          <FolderDirents
            className="media-view__dirents"
            langtag={langtag}
            folder={folder}
            fileIdsDiff={fileIdsDiff}
            layout={layout}
          />

          {canUserCreateFiles() && (
            <FileUpload
              className="media-view__upload"
              ref={dropzoneRef}
              langtag={langtag}
              folder={folder}
            />
          )}
        </div>
      </div>
    </>
  );
}
