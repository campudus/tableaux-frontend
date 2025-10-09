import f from "lodash/fp";
import i18n from "i18next";
import Dropzone from "react-dropzone";
import { useDispatch, useSelector } from "react-redux";
import { ReactElement, useEffect, useRef, useState } from "react";
import {
  Attachment,
  Cell,
  Folder,
  FolderID,
  GRUDStore
} from "../../../types/grud";
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
import AttachmentDirents from "./AttachmentDirents";
import { changeCellValue } from "../../../redux/actions/cellActions";
import { idsToIndices } from "../../../redux/redux-helpers";
import {
  FILTER_MODE_DEFAULT,
  Layout,
  ORDER_MODE_DEFAULT,
  SharedProps,
  ToggleAction
} from "./AttachmentOverlay";
import SearchFunctions from "../../../helpers/searchFunctions";
import { retrieveTranslation } from "../../../helpers/multiLanguage";

type LayoutState = { nav: Layout; content: Layout };

export type AttachmentOverlayBodyProps = SharedProps & {
  cell: Cell;
  folderId?: FolderID | null;
};

export default function AttachmentOverlayBody({
  langtag,
  cell,
  folderId,
  sharedData,
  updateSharedData
}: AttachmentOverlayBodyProps): ReactElement {
  const translate = retrieveTranslation(langtag);
  const {
    folder,
    filterMode = FILTER_MODE_DEFAULT,
    filterValue,
    orderMode = ORDER_MODE_DEFAULT
  } = sharedData ?? {};
  const ids = {
    tableId: cell.table.id,
    columnId: cell.column.id,
    rowId: cell.row.id
  };
  const attachedFiles = useSelector<GRUDStore, Attachment[]>(store => {
    const [rowIdx, colIdx] = idsToIndices(ids, store);
    return f.get(
      ["rows", ids.tableId, "data", rowIdx!, "values", colIdx!],
      store
    );
  });

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
  const filter = SearchFunctions[filterMode];
  const filteredFiles = f.filter(file => {
    const targetValue = translate(file.title);
    return filter(filterValue, targetValue) as boolean;
  }, folder?.files);
  const files = f.orderBy(f.prop(orderMode), "desc", filteredFiles);

  // sort new folder to top
  const subfolders = f.orderBy(
    f.propEq("name", i18n.t("media:new_folder")),
    "desc",
    folder?.subfolders ?? []
  );

  const handleNavigate = async (folderId?: FolderID | null) => {
    const apiRoute = toFolder(folderId, langtag);
    const folder: Folder = await makeRequest({ apiRoute, method: "GET" });

    updateSharedData?.(() => ({ ...sharedData, folder }));
  };

  const handleNavigateBack = async () => {
    await handleNavigate(folder?.parentId);
  };

  const handleClickUpload = () => {
    dropzoneRef.current?.open();
  };

  const handleClickNewFolder = async () => {
    dispatch(
      createMediaFolder(
        {
          parentId: folder?.id,
          name: i18n.t("media:new_folder"),
          description: ""
        },
        // refresh folder
        () => handleNavigate(folder?.id)
      )
    );
  };

  const handleSelectLayout = (layout: Partial<LayoutState>) => {
    setLayoutState({ ...layoutState, ...layout });
  };

  const handleToggleLink = (file: Attachment, action: "add" | "remove") => {
    dispatch(
      changeCellValue({
        cell,
        columnId: cell.column.id,
        rowId: cell.row.id,
        tableId: cell.table.id,
        oldValue: attachedFiles,
        newValue:
          action === "add"
            ? [...attachedFiles, file]
            : f.remove(f.matchesProperty("uuid", file.uuid), attachedFiles),
        method: "PUT"
      })
    );
  };

  const handleUploadDone = async () => {
    // refresh folder
    await handleNavigate(folder?.id);
  };

  const handleFindAction = (file: Attachment): ToggleAction => {
    const isAdd = !f.some(({ uuid }) => uuid === file.uuid, attachedFiles);
    return isAdd ? "add" : "remove";
  };

  useEffect(() => {
    void handleNavigate(folderId);
  }, []);

  return (
    <div className="attachment-overlay">
      <div className="attachment-overlay__navigation">
        <a
          href={`/${langtag}/media/${folder?.id}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <h4 className="attachment-overlay__title">
            {isRoot ? i18n.t("media:root_folder_name") : folder?.name}
          </h4>
        </a>

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
          <AttachmentDirents
            className="attachment-overlay__dirents"
            langtag={langtag}
            files={files}
            subfolders={subfolders}
            layout={layoutState.nav}
            onNavigate={handleNavigate}
            onNavigateBack={handleNavigateBack}
            onToggle={handleToggleLink}
            onFindAction={handleFindAction}
          />
        )}

        {canUserCreateFiles() && folder && langtag && (
          <FileUpload
            className="attachment-overlay__upload"
            ref={dropzoneRef}
            langtag={langtag}
            folder={folder}
            onDone={handleUploadDone}
          />
        )}
      </div>
      <div className="attachment-overlay__content">
        <h4 className="attachment-overlay__title">
          {i18n.t("media:files_selected")}
        </h4>

        <div className="attachment-overlay__breadcrumbs">&nbsp;</div>

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

        <AttachmentDirents
          className="attachment-overlay__dirents"
          langtag={langtag}
          files={attachedFiles}
          layout={layoutState.content}
          onNavigate={handleNavigate}
          onToggle={handleToggleLink}
          onFindAction={handleFindAction}
        />
      </div>
    </div>
  );
}
