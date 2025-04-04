import f from "lodash/fp";
import { ReactElement, useState } from "react";
import { Attachment } from "../../../types/grud";
import { FileMeta, FileMetaKey } from "./FileEdit";
import MultiFileEditItem from "./MultiFileEditItem";
import { Langtags } from "../../../constants/TableauxConstants";
import LanguageSwitcher from "../../header/LanguageSwitcher";
import { canUserEditFiles } from "../../../helpers/accessManagementHelper";

type MultiFileEditProps = {
  langtag: string;
  file: Attachment;
  fileMeta: FileMeta;
  updateFileMeta: (key: FileMetaKey, langtag: string, value: string) => void;
};

export default function MultiFileEdit({
  langtag,
  file,
  fileMeta,
  updateFileMeta
}: MultiFileEditProps): ReactElement {
  const fileLangtags = f.keys(file.internalName);
  const fileLangtagsUnset = f.difference(Langtags, fileLangtags);
  const [newFileLangtag, setNewFileLangtag] = useState(fileLangtagsUnset.at(0));

  const handleNewFileLangtag = (newLangtag: string) => {
    setNewFileLangtag(newLangtag);
  };

  return (
    <div className="multifile-file-edit-wrapper content-items">
      {fileLangtags.map(fileLangtag => (
        <MultiFileEditItem
          key={fileLangtag}
          langtag={langtag}
          fileLangtag={fileLangtag}
          file={file}
          fileMeta={fileMeta}
          updateFileMeta={updateFileMeta}
        >
          <LanguageSwitcher
            langtag={fileLangtag}
            disabled={true}
            options={[{ value: fileLangtag, label: fileLangtag }]}
          />
        </MultiFileEditItem>
      ))}

      {canUserEditFiles() && newFileLangtag && (
        <MultiFileEditItem
          langtag={langtag}
          fileLangtag={newFileLangtag}
          file={file}
          fileMeta={fileMeta}
          updateFileMeta={updateFileMeta}
        >
          <LanguageSwitcher
            langtag={newFileLangtag}
            onChange={handleNewFileLangtag}
            options={fileLangtagsUnset.map(lt => ({ value: lt, label: lt }))}
          />
        </MultiFileEditItem>
      )}
    </div>
  );
}
