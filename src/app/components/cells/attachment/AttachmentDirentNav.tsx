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

type AttachmentDirentNavProps = {
  className?: string;
  style?: CSSProperties;
  langtag: string;
  label?: ReactNode;
  layout: Layout;
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
  icon?: "folder" | "folder-back";
};

function AttachmentDirentNav(
  {
    className,
    style,
    langtag,
    label,
    layout,
    onClick,
    icon
  }: AttachmentDirentNavProps,
  ref: ForwardedRef<HTMLDivElement>
): ReactElement {
  return (
    <div
      ref={ref}
      style={style}
      className={cn("attachment-dirent", { [layout]: true }, className)}
    >
      <ButtonAction
        className={cn("attachment-dirent__action", { main: true })}
        icon={
          <MediaThumbnailFolder
            className="attachment-dirent__thumbnail"
            langtag={langtag}
            layout={layout}
            icon={icon}
          />
        }
        label={<span className="attachment-dirent__label">{label}</span>}
        onClick={onClick}
      />
    </div>
  );
}

export default forwardRef(AttachmentDirentNav);
