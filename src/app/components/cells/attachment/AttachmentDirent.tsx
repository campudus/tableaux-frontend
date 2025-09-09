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

type AttachmentDirentProps = {
  className?: string;
  style: CSSProperties;
  langtag: string;
  dirent: Attachment | Folder;
  layout: Layout;
  onNavigate: (id?: FolderID | null) => void;
  width?: number;
  onToggle?: (dirent: Attachment, action: "add" | "remove") => void;
  toggleAction?: "add" | "remove";
};

function AttachmentDirent(
  {
    className,
    style,
    langtag,
    dirent,
    layout,
    onNavigate,
    width = 1000,
    onToggle,
    toggleAction
  }: AttachmentDirentProps,
  direntRef: ForwardedRef<HTMLDivElement>
): ReactElement {
  const isFile = isAttachment(dirent);
  const translate = retrieveTranslation(langtag);
  const direntKey = isFile ? "file" : "folder";

  const label = isFile ? (translate(dirent.title) as string) : dirent.name;
  const labelTruncated = useMemo(() => {
    let charLimit;

    if (layout === "tiles") {
      charLimit = 26;
    } else {
      const pxPerChar = 7.5;
      const wThumb = 45;
      const actionCount = toggleAction === "add" ? 3 : 4;
      const wActs = actionCount * 30;
      const wGaps = 16;
      charLimit = Math.floor((width - wThumb - wActs - wGaps) / pxPerChar);
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

  const handleToggle = () => {
    if (isAttachment(dirent) && onToggle && toggleAction) {
      onToggle(dirent, toggleAction);
    }
  };

  const handleNavigateToMediaFolder = () => {
    if (isFile) {
      onNavigate(dirent?.folder);
    }
  };

  const handleNavigateToMediaFile = () => {
    if (isFile) {
      const mediaUrl = `/${langtag}/media/${dirent?.folder}?uuid=${dirent.uuid}`;

      window.open(mediaUrl, "_blank");
    }
  };

  return (
    <div
      ref={direntRef}
      style={style}
      className={cn("attachment-dirent", { [layout]: true }, className)}
    >
      <ButtonAction
        className={cn("attachment-dirent__action", { main: true })}
        icon={
          isFile ? (
            <MediaThumbnail
              className="attachment-dirent__thumbnail"
              langtag={langtag}
              dirent={dirent}
              layout={layout}
              width={layout === "list" ? 40 : 200}
            />
          ) : (
            <MediaThumbnailFolder
              className="attachment-dirent__thumbnail"
              langtag={langtag}
              layout={layout}
            />
          )
        }
        label={
          <span className="attachment-dirent__label" title={label}>
            {labelTruncated}
          </span>
        }
        onClick={handleClick}
      />

      {layout === "list" && (
        <>
          {isFile && (
            <ButtonAction
              className={cn("attachment-dirent__action", {
                download: true
              })}
              icon={<SvgIcon icon="download" />}
              alt={i18n.t(`media:download_${direntKey}`)}
              onClick={handleDownload}
            />
          )}
          {isFile && toggleAction === "remove" && (
            <ButtonAction
              className={cn("attachment-dirent__action", {
                folder: true
              })}
              icon={<i className="fa fa-folder" />}
              alt={i18n.t(`media:folder_${direntKey}`)}
              onClick={handleNavigateToMediaFolder}
            />
          )}
          {isFile && (
            <ButtonAction
              className={cn("attachment-dirent__action", {
                edit: true
              })}
              icon={<SvgIcon icon="edit" />}
              alt={i18n.t(`media:change_${direntKey}`)}
              onClick={handleNavigateToMediaFile}
            />
          )}
          {isFile && toggleAction ? (
            <ButtonAction
              className={cn("attachment-dirent__action", {
                toggle: true,
                [toggleAction]: true
              })}
              icon={
                <SvgIcon icon={toggleAction === "add" ? "plus" : "minus"} />
              }
              alt={i18n.t(`media:link_${toggleAction}`)}
              onClick={handleToggle}
            />
          ) : (
            <div></div>
          )}
        </>
      )}

      {layout === "tiles" && (
        <>
          {isFile && (
            <ButtonAction
              className={cn("attachment-dirent__action", {
                menu: true
              })}
              icon={<SvgIcon icon="hdots" />}
              options={[
                {
                  className: cn("attachment-dirent__action", {
                    edit: true
                  }),
                  label: i18n.t(`media:change_${direntKey}`),
                  icon: <SvgIcon icon="edit" />,
                  onClick: handleNavigateToMediaFile
                },
                {
                  className: cn("attachment-dirent__action", {
                    folder: true
                  }),
                  label: i18n.t(`media:folder_${direntKey}`),
                  icon: <i className="icon fa fa-folder" />,
                  onClick: handleNavigateToMediaFolder
                },
                {
                  className: cn("attachment-dirent__action", {
                    download: true
                  }),
                  label: i18n.t(`media:download_${direntKey}`),
                  icon: <SvgIcon icon="download" />,
                  onClick: handleDownload
                }
              ]}
            />
          )}
          {isFile && toggleAction ? (
            <ButtonAction
              className={cn("attachment-dirent__action", {
                toggle: true,
                [toggleAction]: true
              })}
              icon={
                <SvgIcon icon={toggleAction === "add" ? "plus" : "minus"} />
              }
              alt={i18n.t(`media:link_${toggleAction}`)}
              onClick={handleToggle}
            />
          ) : (
            <div></div>
          )}
        </>
      )}
    </div>
  );
}

export default forwardRef(AttachmentDirent);
