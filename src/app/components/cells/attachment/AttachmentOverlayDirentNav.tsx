import {
  CSSProperties,
  ForwardedRef,
  forwardRef,
  MouseEvent,
  ReactElement,
  ReactNode
} from "react";
import { buildClassName as cn } from "../../../helpers/buildClassName";
import ButtonAction from "../../helperComponents/ButtonAction";
import { MediaThumbnailFolder } from "../../media/MediaThumbnail";
import { Layout } from "./AttachmentOverlay";

type AttachmentOverlayDirentNavProps = {
  className?: string;
  style?: CSSProperties;
  langtag: string;
  label?: ReactNode;
  layout: Layout;
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
  icon?: "folder" | "folder-back";
};

function AttachmentOverlayDirentNav(
  {
    className,
    style,
    langtag,
    label,
    layout,
    onClick,
    icon
  }: AttachmentOverlayDirentNavProps,
  ref: ForwardedRef<HTMLDivElement>
): ReactElement {
  return (
    <div
      ref={ref}
      style={style}
      className={cn("attachment-overlay-dirent", { [layout]: true }, className)}
    >
      <ButtonAction
        className={cn("attachment-overlay-dirent__action", { main: true })}
        icon={
          <MediaThumbnailFolder
            className="attachment-overlay-dirent__thumbnail"
            langtag={langtag}
            layout={layout}
            icon={icon}
          />
        }
        label={
          <span className="attachment-overlay-dirent__label">{label}</span>
        }
        onClick={onClick}
      />
    </div>
  );
}

export default forwardRef(AttachmentOverlayDirentNav);
