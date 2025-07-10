import f from "lodash/fp";
import i18n from "i18next";
import { CSSProperties, ReactElement } from "react";
import { isAttachment } from "../../../types/guards";
import { Attachment, Folder } from "../../../types/grud";
import { buildClassName as cn } from "../../../helpers/buildClassName";
import { useDispatch } from "react-redux";
import { retrieveTranslation } from "../../../helpers/multiLanguage";
import apiUrl from "../../../helpers/apiUrl";
import { useHistory } from "react-router-dom";
import { switchFolderHandler } from "../../Router";
import MediaThumbnail from "../MediaThumbnail";
import { Layout } from "./FolderToolbar";
import FolderAction from "./FolderAction";
import SvgIcon from "../../helperComponents/SvgIcon";
import actions from "../../../redux/actionCreators";
import {
  DirentMoveBody,
  DirentMoveFooter,
  DirentMoveHeader
} from "../overlay/DirentMove";
import Header from "../../overlay/Header";
import { FileEditBody, FileEditFooter } from "../overlay/FileEdit";
import { FolderEditBody, FolderEditFooter } from "../overlay/FolderEdit";
import {
  confirmDeleteFile,
  confirmDeleteFolder
} from "../../overlay/ConfirmationOverlay";
import FileDependentsBody from "../overlay/FileDependents";
import {
  canUserDeleteFiles,
  canUserDeleteFolders,
  canUserEditFiles,
  canUserEditFolders
} from "../../../helpers/accessManagementHelper";

type FolderDirentProps = {
  className?: string;
  style: CSSProperties;
  langtag: string;
  dirent: Attachment | Folder;
  layout: Layout;
  fileIdsDiff: string[];
};

export default function FolderDirent({
  className,
  style,
  langtag,
  dirent,
  layout,
  fileIdsDiff
}: FolderDirentProps): ReactElement {
  const dispatch = useDispatch();
  const history = useHistory();

  const isFile = isAttachment(dirent);
  const isModified = isFile && f.contains(dirent.uuid, fileIdsDiff);
  const translate = retrieveTranslation(langtag);
  const label = isFile ? translate(dirent.title) : dirent.name;
  const direntKey = isFile ? "file" : "folder";
  const depCount = isFile ? dirent.dependentRowCount : 0;
  const depLabel = f.cond([
    [f.eq(0), () => null],
    [f.eq(1), () => i18n.t("media:show_dependent_row")],
    [f.lt(1), () => i18n.t("media:show_dependent_rows", { count: depCount })]
  ])(depCount);
  const canEdit = isFile ? canUserEditFiles() : canUserEditFolders();
  const canDelete = isFile ? canUserDeleteFiles() : canUserDeleteFolders();

  const handleClick = () => {
    if (isFile) {
      window.open(apiUrl(translate(dirent.url)), "_blank");
    } else {
      switchFolderHandler(history, langtag, dirent?.id);
    }
  };

  const handleOpenDependentsOverlay = () => {
    if (isFile) {
      dispatch(
        actions.openOverlay({
          name: `show-file-dependents-for-${label}`,
          head: <Header title={label} context={i18n.t("media:dependents")} />,
          body: <FileDependentsBody langtag={langtag} file={dirent} />,
          classes: "file-dependents"
        })
      );
    }
  };

  const handleOpenMoveOverlay = () => {
    const context = i18n.t(`media:move_${direntKey}_to`, { name: label });

    dispatch(
      actions.openOverlay({
        name: `move-${direntKey}-${label}`,
        head: <DirentMoveHeader langtag={langtag} context={context} />,
        body: <DirentMoveBody langtag={langtag} dirent={dirent} />,
        footer: <DirentMoveFooter langtag={langtag} dirent={dirent} />,
        classes: "dirent-move"
      })
    );
  };

  const handleOpenEditOverlay = () => {
    const context = i18n.t(`media:change_${direntKey}`);

    dispatch(
      actions.openOverlay({
        name: `change-${direntKey}-${label}`,
        head: <Header title={label} context={context} />,
        body: isFile ? (
          <FileEditBody langtag={langtag} fileId={dirent.uuid} />
        ) : (
          <FolderEditBody folderId={dirent.id} />
        ),
        footer: isFile ? (
          <FileEditFooter langtag={langtag} fileId={dirent.uuid} />
        ) : (
          <FolderEditFooter folderId={dirent.id} />
        )
      })
    );
  };

  const handleRemove = () => {
    if (isFile) {
      confirmDeleteFile(label, () => {
        dispatch(actions.deleteMediaFile(dirent.uuid));
      });
    } else {
      confirmDeleteFolder(label, () => {
        dispatch(actions.deleteMediaFolder(dirent.id));
      });
    }
  };

  return (
    <div
      style={style}
      className={cn(
        "folder-dirent",
        { modified: isModified, [layout]: true },
        className
      )}
    >
      <FolderAction
        className={cn("folder-dirent__action", { main: true })}
        icon={
          <MediaThumbnail
            className="folder-dirent__thumbnail"
            langtag={langtag}
            dirent={dirent}
            layout={layout}
            width={layout === "list" ? 40 : 200}
          />
        }
        label={
          <span className="folder-dirent__label" title={label}>
            {label}
          </span>
        }
        onClick={handleClick}
      />

      {depCount > 0 && (
        <FolderAction
          className={cn("folder-dirent__action", { dependents: true })}
          variant="link"
          label={depLabel}
          onClick={handleOpenDependentsOverlay}
        />
      )}

      {layout === "list" && (
        <>
          {canEdit && (
            <FolderAction
              className={cn("folder-dirent__action", { move: true })}
              icon={<SvgIcon icon="move" />}
              alt={i18n.t(`media:move_${direntKey}`)}
              onClick={handleOpenMoveOverlay}
            />
          )}
          {canEdit && (
            <FolderAction
              className={cn("folder-dirent__action", { edit: true })}
              icon={<SvgIcon icon="edit" />}
              alt={i18n.t(`media:change_${direntKey}`)}
              onClick={handleOpenEditOverlay}
            />
          )}
          {canDelete && (
            <FolderAction
              className={cn("folder-dirent__action", { remove: true })}
              icon={<SvgIcon icon="trash" />}
              alt={i18n.t(`media:delete_${direntKey}`)}
              onClick={handleRemove}
            />
          )}
        </>
      )}

      {layout === "tiles" && (canEdit || canDelete) && (
        <FolderAction
          className={cn("folder-dirent__action", { menu: true })}
          icon={<SvgIcon icon="hdots" />}
          options={f.compact([
            canEdit && {
              className: cn("folder-dirent__action", { move: true }),
              label: i18n.t(`media:move_${direntKey}`),
              icon: <SvgIcon icon="move" />,
              onClick: handleOpenMoveOverlay
            },
            canEdit && {
              className: cn("folder-dirent__action", { edit: true }),
              label: i18n.t(`media:change_${direntKey}`),
              icon: <SvgIcon icon="edit" />,
              onClick: handleOpenEditOverlay
            },
            canDelete && {
              className: cn("folder-dirent__action", { remove: true }),
              label: i18n.t(`media:delete_${direntKey}`),
              icon: <SvgIcon icon="trash" />,
              onClick: handleRemove
            }
          ])}
        />
      )}
    </div>
  );
}
