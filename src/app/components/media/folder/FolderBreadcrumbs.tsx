import f from "lodash/fp";
import i18n from "i18next";
import { ReactElement } from "react";
import { Folder } from "../../../types/grud";
import Breadcrumbs from "../../helperComponents/Breadcrumbs";
import { buildClassName as cn } from "../../../helpers/buildClassName";

type FolderBreadcrumbsProps = {
  className?: string;
  langtag: string;
  folder: Partial<Folder>;
};

export default function FolderBreadcrumbs({
  className,
  langtag,
  folder
}: FolderBreadcrumbsProps): ReactElement {
  const { parents } = folder;
  const isRoot = folder.id === null;
  const breadcrumbsFolders = f.concat(parents ?? [], !isRoot ? [folder] : []);

  return (
    <Breadcrumbs
      className={cn("folder-breadcrumbs", {}, className)}
      links={[
        {
          path: `/${langtag}/media`,
          label: i18n.t("media:root_folder_name")
        },
        ...breadcrumbsFolders.map(({ id, name }) => ({
          path: `/${langtag}/media/${id}`,
          label: <span>{name ?? `Folder ${id}`}</span>
        }))
      ]}
    />
  );
}
