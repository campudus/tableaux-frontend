import { ReactElement, useState } from "react";
import i18n from "i18next";
import { buildClassName as cn } from "../../../helpers/buildClassName";
import {
  canUserCreateFiles,
  canUserCreateFolders
} from "../../../helpers/accessManagementHelper";
import SvgIcon from "../../helperComponents/SvgIcon";
import FolderAction from "./FolderAction";

export type Layout = "list" | "tiles";

type FolderToolbarProps = {
  className?: string;
  onLayoutChange: (layout: Layout) => void;
  onUploadClick: () => void;
  onNewFolderClick: () => void;
};

export default function FolderToolbar({
  className,
  onLayoutChange,
  onUploadClick,
  onNewFolderClick
}: FolderToolbarProps): ReactElement {
  const [layout, setLayout] = useState<Layout>("list");

  const handleSelectLayout = (layout: Layout) => {
    setLayout(layout);
    onLayoutChange(layout);
  };

  return (
    <div className={cn("folder-toolbar", {}, className)}>
      <FolderAction
        variant="outlined"
        icon={<SvgIcon icon={layout} />}
        options={[
          {
            label: i18n.t("media:layout_list"),
            icon: <SvgIcon icon="list" />,
            onClick: () => handleSelectLayout("list")
          },
          {
            label: i18n.t("media:layout_tiles"),
            icon: <SvgIcon icon="tiles" />,
            onClick: () => handleSelectLayout("tiles")
          }
        ]}
      />

      {canUserCreateFolders() && (
        <FolderAction
          variant="outlined"
          icon={<i className="icon fa fa-plus" />}
          label={i18n.t("media:new_folder")}
          onClick={onNewFolderClick}
        />
      )}

      {canUserCreateFiles() && (
        <FolderAction
          variant="contained"
          icon={<i className="icon fa fa-upload" />}
          label={i18n.t("media:upload_file")}
          onClick={onUploadClick}
        />
      )}
    </div>
  );
}
