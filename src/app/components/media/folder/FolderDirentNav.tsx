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
import MediaThumbnail from "../MediaThumbnail";
import { Layout } from "./FolderToolbar";

type FolderDirentNavProps = {
  className?: string;
  style?: CSSProperties;
  langtag: string;
  label: ReactNode;
  layout: Layout;
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
};

function FolderDirentNav(
  { className, style, langtag, label, layout, onClick }: FolderDirentNavProps,
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
          <MediaThumbnail
            className="folder-dirent__thumbnail"
            langtag={langtag}
            layout={layout}
          />
        }
        label={<span className="folder-dirent__label">{label}</span>}
        onClick={onClick}
      />
    </div>
  );
}

export default forwardRef(FolderDirentNav);
