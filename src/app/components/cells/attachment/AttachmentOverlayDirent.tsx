import f from "lodash/fp";
import i18n from "i18next";
import {
  CSSProperties,
  ForwardedRef,
  forwardRef,
  ReactElement,
  useMemo
} from "react";
import { isAttachment } from "../../../types/guards";
import { Attachment, Folder, FolderID } from "../../../types/grud";
import { buildClassName as cn } from "../../../helpers/buildClassName";
import { retrieveTranslation } from "../../../helpers/multiLanguage";
import apiUrl from "../../../helpers/apiUrl";
import MediaThumbnail, {
  MediaThumbnailFolder
} from "../../media/MediaThumbnail";
import { Layout } from "./AttachmentOverlay";
import ButtonAction from "../../helperComponents/ButtonAction";
import SvgIcon from "../../helperComponents/SvgIcon";
import {
  canUserDeleteFiles,
  canUserDeleteFolders,
  canUserEditFiles,
  canUserEditFolders
} from "../../../helpers/accessManagementHelper";

type AttachmentOverlayDirentProps = {
  className?: string;
  style: CSSProperties;
  langtag: string;
  dirent: Attachment | Folder;
  layout: Layout;
  onNavigate: (id?: FolderID | null) => void;
  width?: number;
};

function AttachmentOverlayDirent(
  {
    className,
    style,
    langtag,
    dirent,
    layout,
    onNavigate,
    width = 1000
  }: AttachmentOverlayDirentProps,
  direntRef: ForwardedRef<HTMLDivElement>
): ReactElement {
  const isFile = isAttachment(dirent);
  const translate = retrieveTranslation(langtag);
  const direntKey = isFile ? "file" : "folder";
  const canEdit = isFile ? canUserEditFiles() : canUserEditFolders();
  const canDelete = isFile ? canUserDeleteFiles() : canUserDeleteFolders();

  const label = isFile ? (translate(dirent.title) as string) : dirent.name;
  const labelTruncated = useMemo(() => {
    let charLimit;

    if (layout === "tiles") {
      charLimit = 16;
    } else {
      const pxPerChar = 7.2;
      const wThumb = 45;
      const wActs = 1 * 45;
      charLimit = Math.floor((width - wThumb - wActs) / pxPerChar);
    }

    if (label.length <= charLimit) {
      return label;
    }

    const labelStart = label.slice(0, charLimit - 10);
    const labelEnd = label.slice(-8);

    return `${labelStart}...${labelEnd}`;
  }, [dirent, layout, width]);

  const handleClick = () => {
    if (isFile) {
      window.open(apiUrl(translate(dirent.url)), "_blank");
    } else {
      onNavigate(dirent?.id);
    }
  };

  const handleDownload = () => {
    if (isFile) {
      const link = document.createElement("a");
      link.href = apiUrl(translate(dirent.url));
      link.download = "";
      link.click();
    }
  };

  return (
    <div
      ref={direntRef}
      style={style}
      className={cn("attachment-overlay-dirent", { [layout]: true }, className)}
    >
      <ButtonAction
        className={cn("attachment-overlay-dirent__action", { main: true })}
        icon={
          isFile ? (
            <MediaThumbnail
              className="attachment-overlay-dirent__thumbnail"
              langtag={langtag}
              dirent={dirent}
              layout={layout}
              width={layout === "list" ? 40 : 200}
            />
          ) : (
            <MediaThumbnailFolder
              className="attachment-overlay-dirent__thumbnail"
              langtag={langtag}
              layout={layout}
            />
          )
        }
        label={
          <span className="attachment-overlay-dirent__label" title={label}>
            {labelTruncated}
          </span>
        }
        onClick={handleClick}
      />

      {layout === "list" && (
        <>
          {isFile && (
            <ButtonAction
              className={cn("attachment-overlay-dirent__action", {
                download: true
              })}
              icon={<SvgIcon icon="download" />}
              alt={i18n.t(`media:download_${direntKey}`)}
              onClick={handleDownload}
            />
          )}
        </>
      )}

      {layout === "tiles" && (canEdit || canDelete) && isFile && (
        <ButtonAction
          className={cn("attachment-overlay-dirent__action", { menu: true })}
          icon={<SvgIcon icon="hdots" />}
          options={f.compact([
            isFile && {
              className: cn("attachment-overlay-dirent__action", {
                download: true
              }),
              label: i18n.t(`media:download_${direntKey}`),
              icon: <SvgIcon icon="download" />,
              onClick: handleDownload
            }
          ])}
        />
      )}
    </div>
  );
}

export default forwardRef(AttachmentOverlayDirent);
