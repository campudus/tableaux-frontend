import { ChangeEvent, MouseEvent, ReactElement, useState } from "react";
import { FileMeta, FileMetaKey } from "./FileEdit";
import { Langtags } from "../../../constants/TableauxConstants";
import { getLanguageOrCountryIcon as getLangIcon } from "../../../helpers/multiLanguage";
import { canUserEditFiles } from "../../../helpers/accessManagementHelper";

type SingleFileTextInputProps = {
  langtag: string;
  label: string;
  name: FileMetaKey;
  fileMeta: FileMeta;
  updateFileMeta: (key: FileMetaKey, langtag: string, value: string) => void;
};

export default function SingleFileTextInput({
  langtag,
  label,
  name,
  fileMeta,
  updateFileMeta
}: SingleFileTextInputProps): ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const fileLangtags = isOpen ? Langtags : [langtag];

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleUpdateInput = (event: ChangeEvent<HTMLInputElement>) => {
    updateFileMeta(name, event.target.lang, event.target.value);
  };

  const handleClickInput = (event: MouseEvent<HTMLInputElement>) => {
    event.stopPropagation();
  };

  return (
    <div className="item-contents" onClick={handleToggle}>
      <div className="item-header">{label}</div>

      {fileLangtags.map(fileLangtag => (
        <div key={fileLangtag} className="item">
          <div className="item-content">
            <div onClick={handleToggle}>{getLangIcon(fileLangtag)}</div>

            <input
              disabled={!canUserEditFiles()}
              type="text"
              lang={fileLangtag}
              value={fileMeta?.[name]?.[fileLangtag] ?? ""}
              onChange={handleUpdateInput}
              onClick={handleClickInput}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
