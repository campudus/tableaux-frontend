import i18n from "i18next";
import { ChangeEvent, PropsWithChildren, ReactElement } from "react";
import { Attachment } from "../../../types/grud";
import MediaLink from "../MediaLink";
import { FileMeta, FileMetaKey } from "./FileEdit";
import { canUserEditFiles } from "../../../helpers/accessManagementHelper";
import FileDropzone from "./FileDropzone";
import FileIcon from "../folder/FileIcon";

type MultiFileEditItemProps = PropsWithChildren<{
  langtag: string;
  fileLangtag: string;
  file: Attachment;
  fileMeta: FileMeta;
  updateFileMeta: (key: FileMetaKey, langtag: string, value: string) => void;
}>;

export default function MultiFileEditItem({
  langtag,
  file,
  fileLangtag,
  fileMeta,
  updateFileMeta,
  children
}: MultiFileEditItemProps): ReactElement {
  const canEdit = canUserEditFiles();
  const fileInternalName = file.internalName[fileLangtag];

  const fileMetaEntries: [keyof FileMeta, string][] = [
    ["title", i18n.t("media:file_title_label")],
    ["description", i18n.t("media:file_description_label")],
    ["externalName", i18n.t("media:file_link_name_label")]
  ];

  const handleUpdateInput = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, lang, value } = event.target;
    updateFileMeta(name as keyof FileMeta, lang, value);
  };

  return (
    <div className="multifile-file-edit item">
      <div className="cover-wrapper">
        <div className="cover">
          <FileDropzone langtag={langtag} fileLangtag={fileLangtag} file={file}>
            <FileIcon name={fileInternalName} />
            <span className="replace-note">
              {i18n.t("media:replace_existing_file")}
            </span>
          </FileDropzone>
        </div>

        <span className="open-file">
          <MediaLink file={file} langtag={fileLangtag}>
            {i18n.t("media:open_file")}
          </MediaLink>
        </span>
      </div>

      <div className="properties-wrapper">
        {children}

        {fileMetaEntries.map(([name, label]) => (
          <div key={name} className="item">
            <div className="item-header">{label}</div>
            <input
              disabled={!canEdit}
              type="text"
              name={name}
              lang={fileLangtag}
              value={fileMeta?.[name]?.[fileLangtag] ?? ""}
              onChange={handleUpdateInput}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
