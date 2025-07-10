import f from "lodash/fp";
import i18n from "i18next";
import { useHistory } from "react-router-dom";
import { ReactElement, useEffect } from "react";
import { AutoSizer, List } from "react-virtualized";
import { useDispatch, useSelector } from "react-redux";
import Header from "../../overlay/Header";
import { Attachment, Folder, FolderID } from "../../../types/grud";
import {
  editMediaFile,
  editMediaFolder
} from "../../../redux/actions/mediaActions";
import Footer from "../../overlay/Footer";
import { canUserEditFiles } from "../../../helpers/accessManagementHelper";
import Breadcrumbs from "../../helperComponents/Breadcrumbs";
import ButtonAction from "../../helperComponents/ButtonAction";
import { makeRequest } from "../../../helpers/apiHelper";
import { toFolder } from "../../../helpers/apiRoutes";
import { MediaState } from "../../../redux/reducers/media";
import { switchFolderHandler } from "../../Router";
import { isAttachment } from "../../../types/guards";
import MediaThumbnail from "../MediaThumbnail";
import FolderDirentNav from "../folder/FolderDirentNav";

type ReduxState = { media: MediaState };

type DirentMoveProps = {
  langtag?: string;
  context?: string;
  dirent?: Attachment | Folder;
  // provided through hoc
  sharedData?: Folder; // targetFolder
  updateSharedData?: (updateFn: (data?: Folder) => Folder) => void;
};

export function DirentMoveHeader(props: DirentMoveProps): ReactElement {
  const {
    langtag,
    sharedData: targetFolder,
    updateSharedData: updateTargetFolder
  } = props;
  const isRoot = targetFolder?.id === null;
  const folders = f.compact(
    f.concat(targetFolder?.parents, !isRoot ? [targetFolder] : [])
  );

  const handleNavigate = async (folderId?: FolderID) => {
    const folder: Folder = await makeRequest({
      apiRoute: toFolder(folderId, langtag),
      method: "GET"
    });

    updateTargetFolder?.(() => folder);
  };

  return (
    <Header
      {...props}
      title={
        <Breadcrumbs
          links={[
            {
              label: i18n.t("media:root_folder_name"),
              onClick: () => handleNavigate()
            },
            ...folders.map(({ id, name }) => ({
              onClick: () => handleNavigate(id),
              label: (
                <>
                  <i className="fa fa-folder-open" />
                  <span>{name ?? `Folder ${id}`}</span>
                </>
              )
            }))
          ]}
        />
      }
    />
  );
}

export function DirentMoveBody(props: DirentMoveProps): ReactElement {
  const {
    langtag,
    dirent,
    sharedData: targetFolder,
    updateSharedData: updateTargetFolder
  } = props;
  const isFile = isAttachment(dirent);
  const currentFolder = useSelector<ReduxState, Partial<Folder>>(
    state => state.media.data
  );
  const targetSubfolders = targetFolder?.subfolders ?? [];
  const subfolders = isFile
    ? targetSubfolders
    : f.filter(folder => folder.id !== dirent?.id, targetSubfolders);
  const isTargetRoot = targetFolder?.id === null;

  const handleNavigate = async (folderId?: FolderID | null) => {
    const folder: Folder = await makeRequest({
      apiRoute: toFolder(folderId, langtag),
      method: "GET"
    });

    updateTargetFolder?.(() => folder);
  };

  useEffect(() => {
    updateTargetFolder?.(() => currentFolder as Folder);
  }, []);

  return (
    <div className="dirent-move__list">
      {!isTargetRoot && (
        <FolderDirentNav
          langtag={langtag!}
          label=".."
          layout="list"
          onClick={() => handleNavigate(targetFolder?.parentId)}
        />
      )}

      <AutoSizer>
        {({ height, width }) => (
          <List
            height={height}
            width={width}
            rowCount={subfolders.length}
            overscanRowCount={10}
            rowHeight={40}
            rowRenderer={({ index, style }) => {
              const subfolder = subfolders[index]!;

              return (
                <FolderDirentNav
                  key={subfolder.id}
                  style={style}
                  langtag={langtag!}
                  label={subfolder.name}
                  layout="list"
                  onClick={() => handleNavigate(subfolder.id)}
                />
              );
            }}
          />
        )}
      </AutoSizer>
    </div>
  );
}

export function DirentMoveFooter(props: DirentMoveProps): ReactElement {
  const { langtag, dirent, sharedData: targetFolder } = props;
  const isFile = isAttachment(dirent);
  const canEdit = canUserEditFiles();
  const history = useHistory();
  const dispatch = useDispatch();

  const handleNavigate = () => {
    switchFolderHandler(history, langtag, targetFolder?.id);
  };

  const handleSave = () => {
    if (isFile) {
      dispatch(
        editMediaFile(
          dirent.uuid,
          {
            title: dirent.title,
            description: dirent.description,
            externalName: dirent.externalName,
            internalName: dirent.internalName,
            mimeType: dirent.mimeType,
            folder: targetFolder?.id ?? null
          },
          handleNavigate
        )
      );
    } else if (dirent) {
      dispatch(
        editMediaFolder(
          dirent.id,
          {
            name: dirent.name,
            description: dirent.description,
            parentId: targetFolder?.id
          },
          handleNavigate
        )
      );
    }
  };

  return (
    <Footer
      {...props}
      buttonActions={{
        neutral: [i18n.t("common:cancel"), null],
        positive: canEdit ? [i18n.t("media:move"), handleSave] : null
      }}
    />
  );
}
