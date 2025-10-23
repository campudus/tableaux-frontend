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
import { MediaThumbnailFolder } from "../MediaThumbnail";
import { Layout } from "./FolderToolbar";

type FolderDirentNavProps = {
  className?: string;
  style?: CSSProperties;
  langtag: string;
  label?: ReactNode;
  layout: Layout;
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
  icon?: "folder" | "folder-back";
};

function FolderDirentNav(
  {
    className,
    style,
    langtag,
    label,
    layout,
    onClick,
    icon
  }: FolderDirentNavProps,
  ref: ForwardedRef<HTMLDivElement>
): ReactElement {
  return (
    <div
      ref={ref}
      style={style}
      className={cn("folder-dirent", { [layout]: true }, className)}
    >
      <ButtonAction
        className={cn("folder-dirent__action", { main: true })}
        icon={
          <MediaThumbnailFolder
            className="folder-dirent__thumbnail"
            langtag={langtag}
            layout={layout}
            icon={icon}
          />
        }
        label={<span className="folder-dirent__label">{label}</span>}
        onClick={onClick}
      />
    </div>
  );
}

export default forwardRef(FolderDirentNav);
