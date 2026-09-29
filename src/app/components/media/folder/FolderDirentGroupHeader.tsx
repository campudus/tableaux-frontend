import i18n from "i18next";
import { CSSProperties, ReactElement } from "react";
import { buildClassName as cn } from "../../../helpers/buildClassName";
import { Layout } from "./FolderToolbar";

type FolderDirentGroupHeaderProps = {
  style?: CSSProperties;
  label: string;
  layout: Layout;
};

// The group of files without extension has an empty label
export default function FolderDirentGroupHeader({
  style,
  label,
  layout
}: FolderDirentGroupHeaderProps): ReactElement {
  return (
    <div
      style={style}
      className={cn("folder-dirent-group-header", { [layout]: true })}
    >
      {label || i18n.t("media:files_without_extension")}
    </div>
  );
}
