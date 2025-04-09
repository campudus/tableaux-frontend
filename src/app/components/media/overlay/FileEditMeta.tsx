import f from "lodash/fp";
import { ChangeEvent, MouseEvent, ReactElement, useState } from "react";
import { FileMeta, FileMetaKey } from "./FileEdit";
import { Langtags } from "../../../constants/TableauxConstants";
import { getLanguageOrCountryIcon as getLangIcon } from "../../../helpers/multiLanguage";
import { canUserEditFiles } from "../../../helpers/accessManagementHelper";

type FileEditMetaProps = {
  langtag: string;
  label: string;
  name: FileMetaKey;
  fileMeta: FileMeta;
  updateFileMeta: (key: FileMetaKey, langtag: string, value: string) => void;
  isMultilang?: boolean;
};

export default function FileEditMeta({
  langtag,
  label,
  name,
  fileMeta,
  updateFileMeta,
  isMultilang = false
}: FileEditMetaProps): ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const fileLangtags = isOpen && isMultilang ? Langtags : [langtag];

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
    <div
      className="file-edit-meta"
      onClick={isMultilang ? handleToggle : f.noop}
    >
      <div className="file-edit-meta__header">{label}</div>

      {fileLangtags.map(fileLangtag => (
        <div key={fileLangtag} className="file-edit-meta__content">
          <div onClick={isMultilang ? handleToggle : f.noop}>
            {getLangIcon(fileLangtag)}
          </div>

          <input
            disabled={!canUserEditFiles()}
            type="text"
            lang={fileLangtag}
            value={fileMeta?.[name]?.[fileLangtag] ?? ""}
            onChange={handleUpdateInput}
            onClick={handleClickInput}
          />
        </div>
      ))}
    </div>
  );
}
