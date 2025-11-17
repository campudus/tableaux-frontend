import f from "lodash/fp";
import i18n from "i18next";
import { ReactElement, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useHistory } from "react-router-dom";
import { useSearchParams } from "react-router-dom-v5-compat";
import Dropzone from "react-dropzone";
import { switchLanguageHandler } from "../Router";
import GrudHeader from "../GrudHeader";
import Spinner from "../header/Spinner";
import { MediaState } from "../../redux/reducers/media";
import { simpleError } from "../overlay/ConfirmationOverlay";
import FileUpload from "./folder/FileUpload";
import { canUserCreateFiles } from "../../helpers/accessManagementHelper";
import FolderBreadcrumbs from "./folder/FolderBreadcrumbs";
import FolderToolbar, { Layout } from "./folder/FolderToolbar";
import { createMediaFolder } from "../../redux/actions/mediaActions";
import FolderDirents from "./folder/FolderDirents";
import actions from "../../redux/actionCreators";
import Header from "../overlay/Header";
import { retrieveTranslation } from "../../helpers/multiLanguage";
import { FileEditBody, FileEditFooter } from "./overlay/FileEdit";

type ReduxState = { media: MediaState };

type MediaViewProps = {
  langtag: string;
  folderId?: string;
};

export default function MediaView({ langtag }: MediaViewProps): ReactElement {
  const [layout, setLayout] = useState<Layout>("list");
  const dropzoneRef = useRef<Dropzone>(null);
  const history = useHistory();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchParamUuid = searchParams.get("uuid");
  const dispatch = useDispatch();
  const media = useSelector<ReduxState, MediaState>(state => state.media);
  const folder = media.data;
  const translate = retrieveTranslation(langtag);
  const hasNewFolder = f.some(
    f.propEq("name", i18n.t("media:new_folder")),
    folder.subfolders
  );
  const folderPrev = useRef(folder);
  const folderIdPrev = folderPrev.current.id;
  const fileIds = folder.files?.map(({ uuid }) => uuid) ?? [];
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

  useEffect(() => {
    if (searchParamUuid) {
      const file = folder.files?.find(({ uuid }) => uuid === searchParamUuid);

      if (file) {
        const label = translate(file?.title);
        const context = i18n.t("media:change_file");

        dispatch(
          actions.openOverlay({
            name: `change-file-${label}`,
            head: <Header title={label} context={context} />,
            body: <FileEditBody langtag={langtag} fileId={file.uuid} />,
            footer: <FileEditFooter langtag={langtag} fileId={file.uuid} />
          })
        );
        setSearchParams({});
      }
    }
  }, [folder, searchParamUuid]);

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
            onNewFolderClick={!hasNewFolder ? handleClickNewFolder : undefined}
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
