import f from "lodash/fp";
import i18n from "i18next";
import { ReactElement, useState } from "react";
import { Attachment } from "../../../types/grud";
import { FileMeta, FileMetaKey } from "./FileEdit";
import { canUserCreateMedia } from "../../../helpers/accessManagementHelper";
import MediaLink from "../MediaLink";
import SingleFileTextInput from "./SingleFileTextInput";
import LanguageSwitcher from "../../header/LanguageSwitcher";
import { Langtags } from "../../../constants/TableauxConstants";
import FileDropzone from "./FileDropzone";
import FileIcon from "../folder/FileIcon";
import { retrieveTranslation } from "../../../helpers/multiLanguage";

type SingleFileEditProps = {
  langtag: string;
  file: Attachment;
  fileMeta: FileMeta;
  updateFileMeta: (key: FileMetaKey, langtag: string, value: string) => void;
};

export default function SingleFileEdit({
  langtag,
  file,
  fileMeta,
  updateFileMeta
}: SingleFileEditProps): ReactElement {
  const fileInternalName = retrieveTranslation(langtag)(file.internalName);
  const fileLangtags = f.keys(file.internalName);
  const fileLangtagsUnset = f.difference(Langtags, fileLangtags);
  const defaultFileLangtag = fileLangtags.at(0);
  const [newFileLangtag, setNewFileLangtag] = useState(fileLangtagsUnset.at(0));

  const fileMetaEntries: [FileMetaKey, string][] = [
    ["title", i18n.t("media:file_title_label")],
    ["description", i18n.t("media:file_description_label")],
    ["externalName", i18n.t("media:file_link_name_label")]
  ];

  const handleNewFileLangtag = (newLangtag: string) => {
    setNewFileLangtag(newLangtag);
  };

  return (
    <div className="singlefile-edit">
      <div className="item cover-wrapper">
        <div className="cover">
          {defaultFileLangtag && (
            <FileDropzone
              langtag={langtag}
              fileLangtag={defaultFileLangtag}
              file={file}
            >
              <FileIcon name={fileInternalName} />
              <span className="replace-note">
                {i18n.t("media:replace_existing_file")}
              </span>
            </FileDropzone>
          )}
        </div>
        <span className="open-file">
          <MediaLink langtag={langtag} file={file}>
            {i18n.t("media:open_file")}
          </MediaLink>
        </span>
      </div>

      <div className="properties-wrapper content-items">
        {fileMetaEntries.map(([name, label]) => (
          <SingleFileTextInput
            key={name}
            name={name}
            label={label}
            fileMeta={fileMeta}
            updateFileMeta={updateFileMeta}
            langtag={langtag}
          />
        ))}
      </div>

      {canUserCreateMedia() && newFileLangtag && (
        <div className="multifile-wrapper item">
          <FileDropzone
            langtag={langtag}
            fileLangtag={newFileLangtag}
            file={file}
          >
            <div className="convert-multilanguage-note">
              <h4>{i18n.t("media:convert_multilanguage_hl")}</h4>
              <p>{i18n.t("media:convert_multilanguage_description")}</p>
            </div>
          </FileDropzone>

          <LanguageSwitcher
            openOnTop
            langtag={newFileLangtag}
            onChange={handleNewFileLangtag}
            options={fileLangtagsUnset.map(lt => ({ value: lt, label: lt }))}
          />
        </div>
      )}
    </div>
  );
}
