import f from "lodash/fp";
import i18n from "i18next";
import { useDispatch } from "react-redux";
import { ReactElement, useRef, useState } from "react";
import { List, AutoSizer } from "react-virtualized";

import { canUserCreateFolders } from "../../../helpers/accessManagementHelper";
import { Folder as FolderType } from "../../../types/grud";
import { isAttachment } from "../../../types/guards";
import FileUpload from "./FileUpload";
import Subfolder from "./Subfolder";
import File from "./File";
import Breadcrumbs from "../../helperComponents/Breadcrumbs";
import SubfolderEdit from "./SubfolderEdit";
import { createMediaFolder } from "../../../redux/actions/mediaActions";
import { buildClassName as cn } from "../../../helpers/buildClassName";
import Dropzone from "react-dropzone";

type FolderProps = {
  langtag: string;
  folder: Partial<FolderType>;
  fileIdsDiff: string[];
};

export default function Folder({
  langtag,
  folder,
  fileIdsDiff
}: FolderProps): ReactElement {
  const dropzoneRef = useRef<Dropzone>(null);
  const dispatch = useDispatch();
  const [isNewFolder, setIsNewFolder] = useState(false);
  const { parentId, parents, subfolders = [], files } = folder;
  const isRoot = folder.id === null;
  const sortedFiles = f.orderBy(f.prop("updatedAt"), "desc", files);
  const breadcrumbsFolders = f.concat(parents ?? [], !isRoot ? [folder] : []);
  const newFolderName = i18n.t("media:new_folder");
  const dirents = [...subfolders, ...sortedFiles];

  const handleToggleNewFolder = () => {
    setIsNewFolder(isNew => !isNew);
  };

  const handleSaveNewFolder = (name: string) => {
    if (name !== "" && name !== newFolderName) {
      dispatch(createMediaFolder({ parentId, name, description: "" }));
    }
    handleToggleNewFolder();
  };

  const handleClickUpload = () => {
    dropzoneRef.current?.open();
  };

  return (
    <div className="media-folder">
      <div className="media-folder__toolbar">
        <Breadcrumbs
          className="media-folder__breadcrumbs"
          links={[
            {
              path: `/${langtag}/media`,
              label: i18n.t("media:root_folder_name")
            },
            ...breadcrumbsFolders.map(({ id, name }) => ({
              path: `/${langtag}/media/${id}`,
              label: (
                <>
                  <i className="fa fa-folder-open" />
                  <span>{name ?? `Folder ${id}`}</span>
                </>
              )
            }))
          ]}
        />

        <div className="media-folder__actions">
          {canUserCreateFolders() && (
            <button
              className={cn("media-folder__action", { secondary: true })}
              onClick={handleToggleNewFolder}
            >
              <i className="icon fa fa-plus" />
              <span>{i18n.t("media:new_folder")}</span>
            </button>
          )}

          <button
            className={cn("media-folder__action", { primary: true })}
            onClick={handleClickUpload}
          >
            <i className="icon fa fa-upload" />
            <span>{i18n.t("media:upload_file")}</span>
          </button>
        </div>
      </div>

      <div className="media-folder__list">
        {isNewFolder && (
          <div className="media-folder__list-item">
            <SubfolderEdit
              name={i18n.t("media:new_folder")}
              onClose={handleToggleNewFolder}
              onSave={handleSaveNewFolder}
            />
          </div>
        )}
        <AutoSizer>
          {({ height, width }) => (
            <List
              height={height}
              width={width}
              rowCount={dirents.length}
              overscanRowCount={10}
              rowHeight={56}
              rowRenderer={({ index, style }) => {
                const dirent = dirents[index];
                const isFile = isAttachment(dirent);
                const isMod = isFile && f.contains(dirent.uuid, fileIdsDiff);

                return (
                  <div
                    key={isFile ? dirent?.uuid : dirent?.id}
                    style={style}
                    className={cn("media-folder__list-item", {
                      modified: isMod
                    })}
                  >
                    {isFile ? (
                      <File langtag={langtag} file={dirent} />
                    ) : (
                      <Subfolder langtag={langtag} folder={dirent} />
                    )}
                  </div>
                );
              }}
            />
          )}
        </AutoSizer>
      </div>

      <FileUpload ref={dropzoneRef} langtag={langtag} folder={folder} />
    </div>
  );
}
