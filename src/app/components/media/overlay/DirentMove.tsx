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
import { makeRequest } from "../../../helpers/apiHelper";
import { toFolder } from "../../../helpers/apiRoutes";
import { MediaState } from "../../../redux/reducers/media";
import Subfolder from "../folder/Subfolder";
import { switchFolderHandler } from "../../Router";

type ReduxState = { media: MediaState };

type DirentMoveProps = {
  langtag?: string;
  context?: string;
  sourceFile?: Attachment;
  sourceFolder?: Folder;
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
    sourceFolder,
    sharedData: targetFolder,
    updateSharedData: updateTargetFolder
  } = props;
  const currentFolder = useSelector<ReduxState, Partial<Folder>>(
    state => state.media.data
  );
  const subfolders = f.filter(
    folder => folder.id !== sourceFolder?.id,
    targetFolder?.subfolders ?? []
  );

  const handleNavigate = async (folderId?: FolderID) => {
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
      <AutoSizer>
        {({ height, width }) => (
          <List
            height={height}
            width={width}
            rowCount={subfolders.length}
            overscanRowCount={10}
            rowHeight={56}
            rowRenderer={({ index, style }) => {
              const subfolder = subfolders[index];

              return (
                <div
                  key={subfolder?.id}
                  style={style}
                  className="dirent-move__list-item"
                >
                  <Subfolder
                    langtag={langtag!}
                    folder={subfolder}
                    onClick={() => handleNavigate(subfolder.id)}
                  />
                </div>
              );
            }}
          />
        )}
      </AutoSizer>
    </div>
  );
}

export function DirentMoveFooter(props: DirentMoveProps): ReactElement {
  const { langtag, sourceFile, sourceFolder, sharedData: targetFolder } = props;
  const canEdit = canUserEditFiles();
  const history = useHistory();
  const dispatch = useDispatch();

  const handleSave = () => {
    if (sourceFile?.uuid) {
      dispatch(editMediaFile(sourceFile?.uuid, { folder: targetFolder?.id }));
    } else if (sourceFolder?.id) {
      dispatch(
        editMediaFolder(sourceFolder?.id, {
          name: sourceFolder.name,
          description: sourceFolder.description,
          parentId: targetFolder?.id
        })
      );
    }

    switchFolderHandler(history, langtag, targetFolder?.id);
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
