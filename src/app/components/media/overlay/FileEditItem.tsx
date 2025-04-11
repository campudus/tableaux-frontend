import i18n from "i18next";
import { PropsWithChildren, ReactElement } from "react";
import { Attachment } from "../../../types/grud";
import MediaLink from "../MediaLink";
import { FileMeta, FileMetaKey } from "./FileEdit";
import FileDropzone from "./FileDropzone";
import FileIcon from "../folder/FileIcon";
import FileEditMeta from "./FileEditMeta";
import { canUserEditFiles } from "../../../helpers/accessManagementHelper";

type FileEditItemProps = PropsWithChildren<{
  langtag: string;
  fileLangtag: string;
  file: Attachment;
  fileMeta: FileMeta;
  updateFileMeta: (key: FileMetaKey, langtag: string, value: string) => void;
  isMultilang?: boolean;
}>;

export default function FileEditItem({
  langtag,
  file,
  fileLangtag,
  fileMeta,
  updateFileMeta,
  isMultilang,
  children
}: FileEditItemProps): ReactElement {
  const fileInternalName = file.internalName[fileLangtag];

  const fileMetaEntries: [keyof FileMeta, string][] = [
    ["title", i18n.t("media:file_title_label")],
    ["description", i18n.t("media:file_description_label")],
    ["externalName", i18n.t("media:file_link_name_label")]
  ];

  return (
    <div className="file-edit-item">
      <div className="file-edit-item__cover">
        <FileDropzone
          className="file-edit-item__cover-upload"
          fileLangtag={fileLangtag}
          file={file}
          disabled={!canUserEditFiles()}
        >
          {fileInternalName ? (
            <div className="file-edit-item__replace">
              <FileIcon name={fileInternalName} />
              {canUserEditFiles() && (
                <span className="file-edit-item__replace-note">
                  {i18n.t("media:replace_existing_file")}
                </span>
              )}
            </div>
          ) : (
            <div className="file-edit-item__create">
              <div className="file-edit-item__create-title">
                {i18n.t("media:convert_multilanguage_hl")}
              </div>
              <div className="file-edit-item__create-description">
                {i18n.t("media:convert_multilanguage_description")}
              </div>
            </div>
          )}
        </FileDropzone>

        {fileInternalName && (
          <MediaLink
            className="file-edit-item__cover-action"
            file={file}
            langtag={fileLangtag}
          >
            {i18n.t("media:open_file")}
          </MediaLink>
        )}

        {children}
      </div>

      <div className="file-edit-item__meta">
        {fileMetaEntries.map(([name, label]) => (
          <FileEditMeta
            key={name}
            name={name}
            label={label}
            fileMeta={fileMeta}
            updateFileMeta={updateFileMeta}
            langtag={isMultilang ? langtag : fileLangtag}
            isMultilang={isMultilang}
          />
        ))}
      </div>
    </div>
  );
}
