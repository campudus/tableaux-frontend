import f from "lodash/fp";
import i18n from "i18next";
import Dropzone from "react-dropzone";
import { useDispatch } from "react-redux";
import { ReactElement, useEffect, useRef, useState } from "react";
import { Cell, Folder, FolderID } from "../../../types/grud";
import { toFolder } from "../../../helpers/apiRoutes";
import { makeRequest } from "../../../helpers/apiHelper";
import Breadcrumbs from "../../helperComponents/Breadcrumbs";
import { createMediaFolder } from "../../../redux/actions/mediaActions";
import {
  canUserCreateFiles,
  canUserCreateFolders
} from "../../../helpers/accessManagementHelper";
import FileUpload from "../../media/folder/FileUpload";
import ButtonAction from "../../helperComponents/ButtonAction";
import SvgIcon from "../../helperComponents/SvgIcon";
import AttachmentOverlayDirents from "./AttachmentOverlayDirents";

export type Layout = "list" | "tiles";

type LayoutState = { nav: Layout; content: Layout };

type AttachmentOverlayProps = {
  langtag: string;
  context?: string;
  cell: Cell;
  folderId?: FolderID | null;
  // provided through hoc
  sharedData?: Folder;
  updateSharedData?: (updateFn: (data?: Folder) => Folder) => void;
};

export default function AttachmentOverlayBody({
  langtag,
  folderId,
  sharedData: folder,
  updateSharedData: updateFolder
}: AttachmentOverlayProps): ReactElement {
  const dispatch = useDispatch();
  const [layoutState, setLayoutState] = useState<LayoutState>({
    nav: "list",
    content: "list"
  });
  const dropzoneRef = useRef<Dropzone>(null);
  const isRoot = folder?.id === null;
  const parents = isRoot ? [] : f.compact([...(folder?.parents ?? []), folder]);
  const hasNewFolder = f.some(
    f.propEq("name", i18n.t("media:new_folder")),
    folder?.subfolders
  );

  const handleNavigate = async (folderId?: FolderID | null) => {
    const apiRoute = toFolder(folderId, langtag);
    const folder: Folder = await makeRequest({ apiRoute, method: "GET" });

    updateFolder?.(() => folder);
  };

  const handleClickUpload = () => {
    dropzoneRef.current?.open();
  };

  const handleClickNewFolder = () => {
    dispatch(
      createMediaFolder({
        parentId: folder?.id,
        name: i18n.t("media:new_folder"),
        description: ""
      })
    );
  };

  const handleSelectLayout = (layout: Partial<LayoutState>) => {
    setLayoutState({ ...layoutState, ...layout });
  };

  useEffect(() => {
    handleNavigate(folderId);
  }, []);

  return (
    <div className="attachment-overlay">
      <div className="attachment-overlay__navigation">
        <h4 className="attachment-overlay__title">
          {isRoot ? i18n.t("media:root_folder_name") : folder?.name}
        </h4>

        <div className="attachment-overlay__toolbar">
          <ButtonAction
            variant="outlined"
            icon={<SvgIcon icon={layoutState.nav} />}
            options={[
              {
                label: i18n.t("media:layout_list"),
                icon: <SvgIcon icon="list" />,
                onClick: () => handleSelectLayout({ nav: "list" })
              },
              {
                label: i18n.t("media:layout_tiles"),
                icon: <SvgIcon icon="tiles" />,
                onClick: () => handleSelectLayout({ nav: "tiles" })
              }
            ]}
          />

          {canUserCreateFolders() && (
            <ButtonAction
              variant="outlined"
              icon={<i className="icon fa fa-plus" />}
              onClick={handleClickNewFolder}
              alt={hasNewFolder ? i18n.t("media:new_folder_exists") : undefined}
              disabled={hasNewFolder}
            />
          )}

          {canUserCreateFiles() && (
            <ButtonAction
              variant="outlined"
              icon={<i className="icon fa fa-upload" />}
              onClick={handleClickUpload}
            />
          )}
        </div>

        <Breadcrumbs
          className="attachment-overlay__breadcrumbs"
          links={[
            {
              label: i18n.t("media:root_folder_name"),
              onClick: () => handleNavigate()
            },
            ...parents.map(({ id, name }) => ({
              onClick: () => handleNavigate(id),
              label: name ?? `Folder ${id}`
            }))
          ]}
        />

        {folder && (
          <AttachmentOverlayDirents
            className="attachment-overlay__dirents"
            langtag={langtag}
            folder={folder}
            layout={layoutState.nav}
            onNavigate={handleNavigate}
          />
        )}

        {canUserCreateFiles() && folder && langtag && (
          <FileUpload
            className="attachment-overlay__upload"
            ref={dropzoneRef}
            langtag={langtag}
            folder={folder}
          />
        )}
      </div>
      <div className="attachment-overlay__content">
        <h4 className="attachment-overlay__title">
          {i18n.t("media:files_selected")}
        </h4>

        <div className="attachment-overlay__toolbar">
          <ButtonAction
            variant="outlined"
            alignmentH="left"
            icon={<SvgIcon icon={layoutState.content} />}
            options={[
              {
                label: i18n.t("media:layout_list"),
                icon: <SvgIcon icon="list" />,
                onClick: () => handleSelectLayout({ content: "list" })
              },
              {
                label: i18n.t("media:layout_tiles"),
                icon: <SvgIcon icon="tiles" />,
                onClick: () => handleSelectLayout({ content: "tiles" })
              }
            ]}
          />
        </div>

        {/* <AttachmentOverlayDirents
            className="attachment-overlay__dirents"
            langtag={langtag}
            folder={folder}
            layout={layout}
            onNavigate={handleNavigate}
          /> */}
      </div>
    </div>
  );
}
