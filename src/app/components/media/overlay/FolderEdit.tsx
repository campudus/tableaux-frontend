import i18n from "i18next";
import f from "lodash/fp";
import { useDispatch, useSelector } from "react-redux";
import { ChangeEvent, ReactElement, useEffect, useRef, useState } from "react";
import { Folder, FolderID } from "../../../types/grud";
import { editMediaFolder } from "../../../redux/actions/mediaActions";
import Footer from "../../overlay/Footer";
import { canUserEditFolders } from "../../../helpers/accessManagementHelper";
import { MediaState } from "../../../redux/reducers/media";

type ReduxState = { media: MediaState };

export type FolderMeta = Pick<Folder, "name">;

export type FolderMetaKey = keyof FolderMeta;

type FolderEditProps = {
  folderId: FolderID;
  // provided through hoc
  sharedData?: FolderMeta;
  updateSharedData?: (updateFn: (data: FolderMeta) => FolderMeta) => void;
};

export function FolderEditBody({
  folderId,
  updateSharedData: updateFolderMeta
}: FolderEditProps): ReactElement | null {
  const folder = useSelector<ReduxState, Folder | undefined>(state =>
    state.media.data?.subfolders?.find(f.propEq("id", folderId))
  );
  const { name = "" } = folder ?? {};
  const initialFolderMeta = { name };
  const [folderMeta, setFolderMeta] = useState(initialFolderMeta);
  const oldFolder = useRef(folder);

  const handleUpdateName = (event: ChangeEvent<HTMLInputElement>) => {
    setFolderMeta(f.assoc("name", event.target.value, folderMeta));
  };

  useEffect(() => {
    if (!f.isEqual(oldFolder.current, folder)) {
      setFolderMeta(initialFolderMeta);
    }
  }, [oldFolder.current, folder]);

  useEffect(() => {
    updateFolderMeta?.(() => folderMeta);
  }, [folderMeta]);

  if (!folder) {
    return null;
  }

  return (
    <div className="folder-edit">
      <div className="folder-edit-item">
        <div className="folder-edit-item__header">
          {i18n.t("media:rename_folder")}
        </div>

        <div className="folder-edit-item__content">
          <input
            disabled={!canUserEditFolders()}
            type="text"
            value={folderMeta.name}
            onChange={handleUpdateName}
          />
        </div>
      </div>
    </div>
  );
}

export function FolderEditFooter(props: FolderEditProps): ReactElement {
  const { folderId, sharedData: folderMeta } = props;
  const folder = useSelector<ReduxState, Folder | undefined>(state =>
    state.media.data?.subfolders?.find(f.propEq("id", folderId))
  );
  const canEdit = canUserEditFolders();
  const dispatch = useDispatch();

  const handleSave = () => {
    if (folder && folderMeta?.name) {
      dispatch(
        editMediaFolder(folderId, {
          name: folderMeta.name,
          description: folder.description,
          parentId: folder.parentId
        })
      );
    }
  };

  return (
    <Footer
      {...props}
      buttonActions={{
        neutral: [i18n.t("common:cancel"), null],
        positive: canEdit ? [i18n.t("common:save"), handleSave] : null
      }}
    />
  );
}
