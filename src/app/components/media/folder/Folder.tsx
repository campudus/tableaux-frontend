import f from "lodash/fp";
import i18n from "i18next";
import { useHistory } from "react-router-dom";
import { MouseEvent, ReactElement } from "react";
import { List, AutoSizer, WindowScroller } from "react-virtualized";

import { canUserCreateFolders } from "../../../helpers/accessManagementHelper";
import { Folder as FolderType } from "../../../types/grud";
import { switchFolderHandler } from "../../Router";
import SubfolderNew from "./SubfolderNew";
import FileUpload from "./FileUpload";
import Subfolder from "./Subfolder";
import File from "./File";

type FolderProps = {
  langtag: string;
  folder: Partial<FolderType>;
  modifiedFileIds: string[];
};

export default function Folder({
  langtag,
  folder,
  modifiedFileIds
}: FolderProps): ReactElement {
  const history = useHistory();
  const { id, name, description, parent, subfolders, files } = folder;
  const isRoot = name === "root";
  const rootName = i18n.t("media:root_folder_name");
  const nameDesc = f.compact([name, description]).join(" - ");
  const folderName = isRoot ? rootName : name ? nameDesc : `Folder ${id}`;
  const sortedFiles = f.orderBy(f.prop("updatedAt"), "desc", files);

  const handleBack = (event: MouseEvent<HTMLButtonElement>) => {
    switchFolderHandler(history, langtag, parent);
    event.preventDefault();
  };

  return (
    <div id="media-wrapper">
      {isRoot ? (
        <div className="current-folder is-root">{folderName}</div>
      ) : (
        <div className="current-folder">
          <button onClick={handleBack}>
            <span className="back">
              <i className="fa fa-chevron-left" />
              {folderName}
            </span>
          </button>
        </div>
      )}

      {canUserCreateFolders() && <SubfolderNew parent={folder} />}

      <div className="media-switcher">
        <ol className="media-switcher-menu">
          {subfolders?.map(folder => (
            <li key={folder.id}>
              <Subfolder langtag={langtag} folder={folder} />
            </li>
          ))}
        </ol>
      </div>

      <div className="media-switcher">
        <WindowScroller>
          {scrollerProps => (
            <AutoSizer disableHeight>
              {sizerProps => (
                <List
                  autoHeight
                  width={sizerProps.width}
                  height={scrollerProps.height}
                  scrollTop={scrollerProps.scrollTop}
                  rowCount={files?.length ?? 0}
                  overscanRowCount={10}
                  rowHeight={41}
                  rowRenderer={({ index, style }) => {
                    const file = sortedFiles[index];
                    const isModified = f.contains(file.uuid, modifiedFileIds);

                    return (
                      <ol
                        key={file.uuid}
                        style={style}
                        className="media-switcher-menu"
                      >
                        <li className={isModified ? "modified-file" : ""}>
                          <File langtag={langtag} file={file} />
                        </li>
                      </ol>
                    );
                  }}
                />
              )}
            </AutoSizer>
          )}
        </WindowScroller>
      </div>

      <FileUpload langtag={langtag} folder={folder} />
    </div>
  );
}
